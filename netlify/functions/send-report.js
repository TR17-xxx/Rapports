const { jsPDF } = require('jspdf');
require('jspdf-autotable');

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

        console.log('📧 Génération du PDF avec jsPDF...');

        // Générer le PDF avec jsPDF
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

// Fonction pour générer le PDF avec jsPDF
async function generatePDF(reportData, weekInfo) {
    try {
        const doc = new jsPDF();
        
        reportData.workers.forEach((worker, index) => {
            if (index > 0) {
                doc.addPage();
            }
            
            // En-tête
            doc.setFontSize(10);
            doc.text('Semaine', 15, 15);
            doc.text(weekInfo.weekNumber || '', 15, 20);
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('RAPPORT HEBDOMADAIRE', 105, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(weekInfo.period || '', 105, 20, { align: 'center' });
            
            doc.text('Nom', 170, 15);
            doc.text(worker.name || '', 170, 20);
            
            // Tableau des heures
            const tableData = [];
            
            // Ajouter les chantiers
            worker.sites.forEach(site => {
                const total = (site.hours.monday || 0) + (site.hours.tuesday || 0) + 
                              (site.hours.wednesday || 0) + (site.hours.thursday || 0) + 
                              (site.hours.friday || 0);
                
                tableData.push([
                    site.name || '',
                    site.hours.monday || '0',
                    site.hours.tuesday || '0',
                    site.hours.wednesday || '0',
                    site.hours.thursday || '0',
                    site.hours.friday || '0',
                    total.toString()
                ]);
            });
            
            // Calculer les totaux
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
            tableData.push([
                'TOTAL',
                mondayTotal.toString(),
                tuesdayTotal.toString(),
                wednesdayTotal.toString(),
                thursdayTotal.toString(),
                fridayTotal.toString(),
                grandTotal.toString()
            ]);
            
            // Lignes vides
            for (let i = 0; i < 3; i++) {
                tableData.push(['', '', '', '', '', '', '']);
            }
            
            doc.autoTable({
                startY: 30,
                head: [['Chantier', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Total']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 20, halign: 'center' },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 20, halign: 'center' },
                    4: { cellWidth: 20, halign: 'center' },
                    5: { cellWidth: 20, halign: 'center' },
                    6: { cellWidth: 20, halign: 'center' }
                }
            });
            
            // Observations
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Observations :', 15, finalY);
            doc.setFont(undefined, 'normal');
            if (worker.observation) {
                doc.text(worker.observation, 15, finalY + 7, { maxWidth: 180 });
            }
            
            // Pied de page
            doc.setFontSize(9);
            doc.text('Signature de l\'ouvrier :', 15, 270);
            doc.text('Signature du chef de chantier :', 110, 270);
        });
        
        // Convertir en buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return pdfBuffer;
        
    } catch (error) {
        throw error;
    }
}
