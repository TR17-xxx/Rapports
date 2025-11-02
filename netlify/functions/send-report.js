const PdfPrinter = require('pdfmake');
const fonts = {
    Roboto: {
        normal: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-MediumItalic.ttf'], 'base64')
    }
};

// Configuration Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Fonction principale Netlify
exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only accept POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        // Vérifier le token d'accès
        const providedToken = event.headers['x-access-token'];
        const requiredToken = process.env.ACCESS_TOKEN || 'rapport2024secure';
        
        if (providedToken !== requiredToken) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Accès non autorisé - Token invalide' 
                })
            };
        }
        
        // Vérifier les variables d'environnement requises
        if (!BREVO_API_KEY) {
            console.error('❌ BREVO_API_KEY manquante');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Configuration serveur incomplète: BREVO_API_KEY manquante. Veuillez configurer les variables d\'environnement dans Netlify.' 
                })
            };
        }
        
        if (!process.env.BREVO_SENDER_EMAIL) {
            console.error('❌ BREVO_SENDER_EMAIL manquante');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Configuration serveur incomplète: BREVO_SENDER_EMAIL manquante. Veuillez configurer les variables d\'environnement dans Netlify.' 
                })
            };
        }
        
        if (!process.env.EMAIL_RECIPIENTS) {
            console.error('❌ EMAIL_RECIPIENTS manquante');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Configuration serveur incomplète: EMAIL_RECIPIENTS manquante. Veuillez configurer les variables d\'environnement dans Netlify.' 
                })
            };
        }
        
        const body = JSON.parse(event.body);
        const { reportData, weekInfo } = body;

        if (!reportData || !weekInfo) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Données manquantes' 
                })
            };
        }

        console.log('📧 Génération du PDF avec pdfmake...');

        // Générer le PDF avec pdfmake
        const pdfBuffer = await generatePDF(reportData, weekInfo);
        
        console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length, 'bytes');

        // Convertir le PDF en base64 pour l'envoi par email
        const pdfBase64 = pdfBuffer.toString('base64');

        // Préparer les destinataires
        const recipients = process.env.EMAIL_RECIPIENTS.split(',').map(email => ({
            email: email.trim()
        }));

        // Préparer l'email avec Brevo
        const emailData = {
            sender: {
                email: process.env.BREVO_SENDER_EMAIL,
                name: 'Rapports Hebdomadaires'
            },
            to: recipients,
            subject: `Rapport Hebdomadaire - ${weekInfo.period}`,
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">📊 Rapport Hebdomadaire</h2>
                    <p><strong>Période :</strong> ${weekInfo.period}</p>
                    <p><strong>Chef de chantier :</strong> ${weekInfo.foreman || 'Non défini'}</p>
                    <p>Veuillez trouver ci-joint le rapport hebdomadaire détaillé au format PDF.</p>
                    <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        Ce rapport a été généré automatiquement par le système de gestion des rapports hebdomadaires.
                    </p>
                </div>
            `,
            attachment: [
                {
                    content: pdfBase64,
                    name: `Rapport_${weekInfo.period.replace(/\s+/g, '_')}.pdf`
                }
            ]
        };

        console.log('📤 Envoi de l\'email via Brevo...');

        // Envoyer l'email via Brevo
        const brevoResponse = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (!brevoResponse.ok) {
            const errorData = await brevoResponse.text();
            console.error('❌ Erreur Brevo:', errorData);
            throw new Error(`Erreur Brevo API: ${brevoResponse.status} - ${errorData}`);
        }

        const brevoResult = await brevoResponse.json();
        console.log('✅ Email envoyé avec succès:', brevoResult);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Rapport envoyé avec succès',
                messageId: brevoResult.messageId
            })
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du rapport:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: `Erreur serveur: ${error.message}` 
            })
        };
    }
};

// Fonction pour générer le PDF avec pdfmake
async function generatePDF(reportData, weekInfo) {
    return new Promise((resolve, reject) => {
        try {
            const printer = new PdfPrinter(fonts);
            
            // Créer le contenu du document pour tous les ouvriers
            const content = [];
            
            reportData.workers.forEach((worker, index) => {
                if (index > 0) {
                    content.push({ text: '', pageBreak: 'before' });
                }
                
                // En-tête
                content.push({
                    table: {
                        widths: ['25%', '50%', '25%'],
                        body: [
                            [
                                { text: 'Semaine\n' + (weekInfo.weekNumber || ''), alignment: 'center', fontSize: 10, margin: [0, 10, 0, 10] },
                                { text: 'RAPPORT HEBDOMADAIRE\n' + (weekInfo.period || ''), alignment: 'center', fontSize: 12, bold: true, margin: [0, 10, 0, 10] },
                                { text: 'Nom\n' + (worker.name || ''), alignment: 'center', fontSize: 10, margin: [0, 10, 0, 10] }
                            ]
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 20]
                });
                
                // Tableau des heures
                const tableBody = [
                    [
                        { text: 'Chantier', bold: true, fontSize: 9 },
                        { text: 'Lundi', bold: true, fontSize: 9, alignment: 'center' },
                        { text: 'Mardi', bold: true, fontSize: 9, alignment: 'center' },
                        { text: 'Mercredi', bold: true, fontSize: 9, alignment: 'center' },
                        { text: 'Jeudi', bold: true, fontSize: 9, alignment: 'center' },
                        { text: 'Vendredi', bold: true, fontSize: 9, alignment: 'center' },
                        { text: 'Total', bold: true, fontSize: 9, alignment: 'center' }
                    ]
                ];
                
                // Ajouter les chantiers
                worker.sites.forEach(site => {
                    const total = (site.hours.monday || 0) + (site.hours.tuesday || 0) + 
                                  (site.hours.wednesday || 0) + (site.hours.thursday || 0) + 
                                  (site.hours.friday || 0);
                    
                    tableBody.push([
                        { text: site.name || '', fontSize: 8 },
                        { text: site.hours.monday || '0', fontSize: 8, alignment: 'center' },
                        { text: site.hours.tuesday || '0', fontSize: 8, alignment: 'center' },
                        { text: site.hours.wednesday || '0', fontSize: 8, alignment: 'center' },
                        { text: site.hours.thursday || '0', fontSize: 8, alignment: 'center' },
                        { text: site.hours.friday || '0', fontSize: 8, alignment: 'center' },
                        { text: total.toString(), fontSize: 8, alignment: 'center' }
                    ]);
                });
                
                // Calculer les totaux par jour
                let mondayTotal = 0, tuesdayTotal = 0, wednesdayTotal = 0, thursdayTotal = 0, fridayTotal = 0;
                worker.sites.forEach(site => {
                    mondayTotal += site.hours.monday || 0;
                    tuesdayTotal += site.hours.tuesday || 0;
                    wednesdayTotal += site.hours.wednesday || 0;
                    thursdayTotal += site.hours.thursday || 0;
                    fridayTotal += site.hours.friday || 0;
                });
                const grandTotal = mondayTotal + tuesdayTotal + wednesdayTotal + thursdayTotal + fridayTotal;
                
                // Ligne de total
                tableBody.push([
                    { text: 'TOTAL', bold: true, fontSize: 9 },
                    { text: mondayTotal.toString(), fontSize: 9, alignment: 'center', color: 'red' },
                    { text: tuesdayTotal.toString(), fontSize: 9, alignment: 'center', color: 'red' },
                    { text: wednesdayTotal.toString(), fontSize: 9, alignment: 'center', color: 'red' },
                    { text: thursdayTotal.toString(), fontSize: 9, alignment: 'center', color: 'red' },
                    { text: fridayTotal.toString(), fontSize: 9, alignment: 'center', color: 'red' },
                    { text: grandTotal.toString(), fontSize: 9, alignment: 'center', color: 'red' }
                ]);
                
                // Lignes vides
                for (let i = 0; i < 3; i++) {
                    tableBody.push(['', '', '', '', '', '', '']);
                }
                
                content.push({
                    table: {
                        widths: [100, 50, 50, 50, 50, 50, 50],
                        body: tableBody
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 20]
                });
                
                // Observations
                content.push({
                    table: {
                        widths: ['*'],
                        body: [
                            [{ text: 'Observations :', bold: true, fontSize: 10 }],
                            [{ text: worker.observation || '', fontSize: 10, alignment: 'center', margin: [0, 10, 0, 10] }]
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 20]
                });
                
                // Pied de page
                content.push({
                    table: {
                        widths: ['50%', '50%'],
                        body: [
                            [
                                { text: 'Signature de l\'ouvrier :', fontSize: 9, margin: [0, 5, 0, 30] },
                                { text: 'Signature du chef de chantier :', fontSize: 9, margin: [0, 5, 0, 30] }
                            ]
                        ]
                    },
                    layout: 'lightHorizontalLines'
                });
            });
            
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [30, 30, 30, 30],
                content: content
            };
            
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks = [];
            
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            
            pdfDoc.end();
            
        } catch (error) {
            reject(error);
        }
    });
}
