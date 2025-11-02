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
            
            // En-tête - 3 colonnes
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Semaine', 15, 15);
            doc.text(weekInfo.weekNumber || '', 15, 20);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('FICHE DE POINTAGE HEBDOMADAIRE', 105, 15, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(weekInfo.period || '', 105, 20, { align: 'center' });
            
            doc.setFontSize(9);
            doc.text('NOM:', 170, 15);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            // Limiter la largeur du nom pour éviter le débordement
            doc.text(worker.name || '', 170, 20, { maxWidth: 35 });
            doc.setFont(undefined, 'normal');
            
            // Tableau des heures avec SAMEDI
            const tableData = [];
            
            // Ajouter les chantiers
            worker.sites.forEach(site => {
                const total = (site.hours.monday || 0) + (site.hours.tuesday || 0) + 
                              (site.hours.wednesday || 0) + (site.hours.thursday || 0) + 
                              (site.hours.friday || 0);
                
                tableData.push([
                    site.name || '',
                    site.hours.monday ? site.hours.monday.toString() : '',
                    site.hours.tuesday ? site.hours.tuesday.toString() : '',
                    site.hours.wednesday ? site.hours.wednesday.toString() : '',
                    site.hours.thursday ? site.hours.thursday.toString() : '',
                    site.hours.friday ? site.hours.friday.toString() : '',
                    '', // SAMEDI vide
                    total > 0 ? total.toFixed(1) : ''
                ]);
            });
            
            // Lignes vides pour remplir (minimum 5 lignes de chantiers)
            const emptyRows = Math.max(0, 5 - worker.sites.length);
            for (let i = 0; i < emptyRows; i++) {
                tableData.push(['', '', '', '', '', '', '', '']);
            }
            
            // Calculer les totaux des heures
            let mondayTotal = 0, tuesdayTotal = 0, wednesdayTotal = 0, thursdayTotal = 0, fridayTotal = 0;
            worker.sites.forEach(site => {
                mondayTotal += site.hours.monday || 0;
                tuesdayTotal += site.hours.tuesday || 0;
                wednesdayTotal += site.hours.wednesday || 0;
                thursdayTotal += site.hours.thursday || 0;
                fridayTotal += site.hours.friday || 0;
            });
            const grandTotal = mondayTotal + tuesdayTotal + wednesdayTotal + thursdayTotal + fridayTotal;
            
            // Ligne de total des heures
            tableData.push([
                '',
                '',
                '',
                '',
                '',
                '',
                'Total',
                grandTotal > 0 ? grandTotal.toFixed(1) : ''
            ]);
            
            // Calculer PANIER, TRANSPORT, TRAJET
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            
            // Jours travaillés
            const workedDays = days.map(day => {
                let totalHours = 0;
                worker.sites.forEach(site => {
                    totalHours += site.hours[day] || 0;
                });
                return totalHours > 0;
            });
            
            // Jours où l'ouvrier est conducteur
            const isDriverDays = days.map(day => worker.drivers && worker.drivers[day]);
            
            // PANIER
            const panierMode = worker.panierMode || 'panier';
            const panierCustom = worker.panierCustom || {};
            let panierValues = [];
            
            if (panierMode === 'panier') {
                panierValues = workedDays.map(worked => worked ? '1' : '');
            } else if (panierMode === 'grand_deplacement') {
                panierValues = workedDays.map(worked => worked ? 'GD' : '');
            } else if (panierMode === 'personnaliser') {
                panierValues = days.map((day, index) => {
                    return workedDays[index] ? (panierCustom[day] || '') : '';
                });
            }
            const panierTotal = panierValues.filter(v => v !== '').length;
            
            // TRANSPORT
            const transportValues = isDriverDays.map(isDriver => isDriver ? '1' : '');
            const transportTotal = transportValues.filter(v => v === '1').length;
            
            // TRAJET
            const trajetValues = workedDays.map(worked => worked ? '1' : '');
            const trajetTotal = trajetValues.filter(v => v === '1').length;
            
            // Ligne PANIER
            tableData.push([
                'PANIER',
                panierValues[0] || '',
                panierValues[1] || '',
                panierValues[2] || '',
                panierValues[3] || '',
                panierValues[4] || '',
                '',
                panierTotal > 0 ? panierTotal.toString() : ''
            ]);
            
            // Ligne TRANSPORT
            tableData.push([
                'TRANSPORT',
                transportValues[0] || '',
                transportValues[1] || '',
                transportValues[2] || '',
                transportValues[3] || '',
                transportValues[4] || '',
                '',
                transportTotal > 0 ? transportTotal.toString() : ''
            ]);
            
            // Ligne TRAJET
            tableData.push([
                'TRAJET',
                trajetValues[0] || '',
                trajetValues[1] || '',
                trajetValues[2] || '',
                trajetValues[3] || '',
                trajetValues[4] || '',
                '',
                trajetTotal > 0 ? trajetTotal.toString() : ''
            ]);
            
            doc.autoTable({
                startY: 30,
                head: [['CHANTIER', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'TOTAL']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.5, lineColor: [0, 0, 0] },
                bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] },
                columnStyles: {
                    0: { cellWidth: 44, halign: 'left', fontSize: 8, overflow: 'linebreak' },
                    1: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    2: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    3: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    4: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    5: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    6: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    7: { cellWidth: 20, halign: 'center', fontSize: 9, fontStyle: 'bold' }
                },
                didParseCell: function(data) {
                    // Mettre en gras les lignes PANIER, TRANSPORT, TRAJET, et la ligne de total
                    const rowData = tableData[data.row.index];
                    if (rowData && (rowData[0] === 'PANIER' || rowData[0] === 'TRANSPORT' || rowData[0] === 'TRAJET')) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [240, 240, 240];
                    }
                    // Ligne de total des heures
                    if (rowData && rowData[6] === 'Total') {
                        data.cell.styles.fontStyle = 'bold';
                        if (data.column.index === 7) {
                            data.cell.styles.textColor = [255, 0, 0];
                        }
                    }
                }
            });
            
            // Observations
            const finalY = doc.lastAutoTable.finalY + 10;
            
            // Dessiner le cadre des observations
            const boxX = 15;
            const boxY = finalY - 3;
            const boxWidth = 180;
            const boxHeight = 25;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(boxX, boxY, boxWidth, boxHeight);
            
            // Titre OBSERVATIONS
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('OBSERVATIONS:', boxX + 2, finalY);
            
            // Afficher INTÉRIMAIRE en orange si applicable
            if (worker.isInterim === true) {
                doc.setTextColor(255, 140, 0); // Orange
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('INTÉRIMAIRE', boxX + 50, finalY);
            }
            
            // Contenu des observations
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            if (worker.observation) {
                doc.setFontSize(9);
                doc.setFont(undefined, 'italic');
                const lines = doc.splitTextToSize(worker.observation, boxWidth - 8);
                doc.text(lines, boxX + 4, finalY + 7);
            }
            
            // Pied de page
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Référence: Agenda chef d\'équipe', 15, 270);
            doc.text('Visa conducteur:', 110, 270);
        });
        
        // Convertir en buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return pdfBuffer;
        
    } catch (error) {
        throw error;
    }
}
