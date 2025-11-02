const PDFDocument = require('pdfkit');

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

        console.log('📧 Génération du PDF avec PDFKit...');

        // Générer le PDF avec PDFKit
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

// Fonction pour générer le PDF avec PDFKit
async function generatePDF(reportData, weekInfo) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 30, bottom: 30, left: 30, right: 30 }
            });

            const chunks = [];
            
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Parcourir chaque ouvrier
            reportData.workers.forEach((worker, index) => {
                if (index > 0) {
                    doc.addPage();
                }

                // En-tête du rapport
                drawHeader(doc, weekInfo, worker);

                // Tableau des heures
                drawHoursTable(doc, worker);

                // Observations
                drawObservations(doc, worker);

                // Pied de page
                drawFooter(doc, weekInfo);
            });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

// Dessiner l'en-tête
function drawHeader(doc, weekInfo, worker) {
    const pageWidth = doc.page.width - 60;
    const headerHeight = 60;
    let y = 30;

    // Bordure principale
    doc.rect(30, y, pageWidth, headerHeight).stroke();

    // Diviser en 3 colonnes
    const col1Width = pageWidth * 0.25;
    const col2Width = pageWidth * 0.5;
    const col3Width = pageWidth * 0.25;

    // Colonne 1 : Semaine
    doc.fontSize(10).text('Semaine', 35, y + 20, { width: col1Width - 10, align: 'center' });
    doc.fontSize(12).font('Helvetica-Bold').text(weekInfo.weekNumber || '', 35, y + 35, { width: col1Width - 10, align: 'center' });

    // Ligne verticale
    doc.moveTo(30 + col1Width, y).lineTo(30 + col1Width, y + headerHeight).stroke();

    // Colonne 2 : Titre et dates
    doc.fontSize(14).font('Helvetica-Bold').text('RAPPORT HEBDOMADAIRE', 30 + col1Width + 5, y + 15, { width: col2Width - 10, align: 'center' });
    doc.fontSize(10).font('Helvetica').text(weekInfo.period || '', 30 + col1Width + 5, y + 35, { width: col2Width - 10, align: 'center' });

    // Ligne verticale
    doc.moveTo(30 + col1Width + col2Width, y).lineTo(30 + col1Width + col2Width, y + headerHeight).stroke();

    // Colonne 3 : Nom de l'ouvrier
    doc.fontSize(9).text('Nom', 30 + col1Width + col2Width + 5, y + 20, { width: col3Width - 10, align: 'center' });
    doc.fontSize(11).font('Helvetica-Bold').text(worker.name || '', 30 + col1Width + col2Width + 5, y + 35, { width: col3Width - 10, align: 'center' });

    doc.font('Helvetica');
}

// Dessiner le tableau des heures
function drawHoursTable(doc, worker) {
    const pageWidth = doc.page.width - 60;
    let y = 110;

    // En-têtes du tableau
    const colWidths = {
        chantier: 100,
        day: 50,
        total: 50
    };

    const headers = ['Chantier', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Total'];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    // Dessiner les en-têtes
    doc.fontSize(9).font('Helvetica-Bold');
    let x = 30;
    
    doc.rect(x, y, colWidths.chantier, 20).stroke();
    doc.text(headers[0], x + 2, y + 6, { width: colWidths.chantier - 4, align: 'left' });
    x += colWidths.chantier;

    for (let i = 1; i < headers.length; i++) {
        const width = i === headers.length - 1 ? colWidths.total : colWidths.day;
        doc.rect(x, y, width, 20).stroke();
        doc.text(headers[i], x + 2, y + 6, { width: width - 4, align: 'center' });
        x += width;
    }

    y += 20;
    doc.font('Helvetica');

    // Dessiner les lignes de chantiers
    worker.sites.forEach(site => {
        x = 30;
        const rowHeight = 20;

        // Nom du chantier
        doc.fontSize(8);
        doc.rect(x, y, colWidths.chantier, rowHeight).stroke();
        doc.text(site.name || '', x + 2, y + 6, { width: colWidths.chantier - 4, align: 'left' });
        x += colWidths.chantier;

        // Heures par jour
        let total = 0;
        days.forEach(day => {
            const hours = site.hours[day] || 0;
            total += hours;
            doc.rect(x, y, colWidths.day, rowHeight).stroke();
            doc.text(hours.toString(), x + 2, y + 6, { width: colWidths.day - 4, align: 'center' });
            x += colWidths.day;
        });

        // Total
        doc.rect(x, y, colWidths.total, rowHeight).stroke();
        doc.font('Helvetica-Bold').text(total.toString(), x + 2, y + 6, { width: colWidths.total - 4, align: 'center' });
        doc.font('Helvetica');

        y += rowHeight;
    });

    // Ligne de total
    x = 30;
    const rowHeight = 25;
    doc.fontSize(9).font('Helvetica-Bold');
    
    doc.rect(x, y, colWidths.chantier, rowHeight).stroke();
    doc.text('TOTAL', x + 2, y + 8, { width: colWidths.chantier - 4, align: 'left' });
    x += colWidths.chantier;

    // Totaux par jour
    days.forEach(day => {
        let dayTotal = 0;
        worker.sites.forEach(site => {
            dayTotal += site.hours[day] || 0;
        });
        doc.rect(x, y, colWidths.day, rowHeight).stroke();
        doc.fillColor('red').text(dayTotal.toString(), x + 2, y + 8, { width: colWidths.day - 4, align: 'center' });
        doc.fillColor('black');
        x += colWidths.day;
    });

    // Total général
    let grandTotal = 0;
    worker.sites.forEach(site => {
        days.forEach(day => {
            grandTotal += site.hours[day] || 0;
        });
    });
    doc.rect(x, y, colWidths.total, rowHeight).stroke();
    doc.fillColor('red').text(grandTotal.toString(), x + 2, y + 8, { width: colWidths.total - 4, align: 'center' });
    doc.fillColor('black').font('Helvetica');

    // Lignes vides pour ajouts manuels
    y += rowHeight;
    for (let i = 0; i < 3; i++) {
        x = 30;
        doc.rect(x, y, colWidths.chantier, 20).stroke();
        x += colWidths.chantier;
        for (let j = 0; j < 6; j++) {
            const width = j === 5 ? colWidths.total : colWidths.day;
            doc.rect(x, y, width, 20).stroke();
            x += width;
        }
        y += 20;
    }
}

// Dessiner les observations
function drawObservations(doc, worker) {
    const pageWidth = doc.page.width - 60;
    const y = doc.page.height - 200;

    doc.rect(30, y, pageWidth, 80).stroke();
    doc.fontSize(10).font('Helvetica-Bold').text('Observations :', 35, y + 5);
    
    if (worker.observation) {
        doc.fontSize(10).font('Helvetica-Oblique').text(worker.observation, 35, y + 25, { 
            width: pageWidth - 10, 
            align: 'center' 
        });
    }
    doc.font('Helvetica');
}

// Dessiner le pied de page
function drawFooter(doc, weekInfo) {
    const pageWidth = doc.page.width - 60;
    const y = doc.page.height - 110;

    // Diviser en 2 colonnes
    const colWidth = pageWidth / 2;

    // Colonne 1 : Signature ouvrier
    doc.rect(30, y, colWidth, 60).stroke();
    doc.fontSize(9).font('Helvetica-Bold').text('Signature de l\'ouvrier :', 35, y + 5);

    // Ligne verticale
    doc.moveTo(30 + colWidth, y).lineTo(30 + colWidth, y + 60).stroke();

    // Colonne 2 : Signature chef de chantier
    doc.rect(30 + colWidth, y, colWidth, 60).stroke();
    doc.fontSize(9).text('Signature du chef de chantier :', 35 + colWidth, y + 5);
    doc.font('Helvetica');
}
