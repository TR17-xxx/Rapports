const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Vérifier la configuration email au démarrage
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Erreur de configuration email:', error);
    } else {
        console.log('✅ Serveur email prêt à envoyer des messages');
    }
});

// Route pour envoyer le rapport par email
app.post('/api/send-report', async (req, res) => {
    try {
        // Vérifier le token d'accès
        const providedToken = req.headers['x-access-token'];
        const requiredToken = process.env.ACCESS_TOKEN || 'rapport2024secure';
        
        if (providedToken !== requiredToken) {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès non autorisé - Token invalide' 
            });
        }
        
        const { htmlContent, weekInfo } = req.body;

        if (!htmlContent || !weekInfo) {
            return res.status(400).json({ 
                success: false, 
                message: 'Données manquantes' 
            });
        }

        console.log('📧 Génération du PDF...');

        // Générer le PDF avec Puppeteer
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Créer une page HTML complète pour le PDF
        const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Hebdomadaire - ${weekInfo.period}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 10pt;
        }
        .print-sheet {
            width: 100%;
            border: 2px solid black;
            margin-bottom: 20px;
            page-break-after: always;
        }
        .print-header {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            border-bottom: 2px solid black;
        }
        .print-header > div {
            padding: 8px;
            border-right: 2px solid black;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        .print-header > div:last-child {
            border-right: none;
        }
        .print-header .semaine {
            font-weight: bold;
            font-size: 10pt;
        }
        .print-header .title {
            font-weight: bold;
            font-size: 12pt;
        }
        .print-header .dates {
            font-size: 9pt;
        }
        .print-header .nom-label {
            font-size: 9pt;
        }
        .print-header .nom-value {
            font-weight: bold;
            font-size: 11pt;
        }
        .print-table {
            width: 100%;
            border-collapse: collapse;
        }
        .print-table th,
        .print-table td {
            border: 1px solid black;
            padding: 4px 2px;
            text-align: center;
            font-size: 9pt;
        }
        .print-table th {
            font-weight: bold;
            background-color: white;
        }
        .print-table .chantier-col {
            text-align: left;
            width: 100px;
            font-size: 8pt;
        }
        .print-table .day-col {
            width: 50px;
            font-size: 8pt;
        }
        .print-table .total-col {
            width: 50px;
            font-weight: bold;
            font-size: 9pt;
        }
        .print-table .section-header {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: left;
            padding: 4px 8px;
        }
        .print-table .total-row {
            font-weight: bold;
        }
        .print-table .total-row .total-value {
            color: red;
        }
        .print-table .empty-row {
            height: 30px;
        }
        .print-observations {
            border-top: 2px solid black;
            padding: 8px;
            min-height: 100px;
        }
        .print-observations-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 10pt;
        }
        .print-observations-content {
            white-space: pre-wrap;
            font-size: 10pt;
            font-style: italic;
            text-align: center;
        }
        .print-footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-top: 2px solid black;
        }
        .print-footer > div {
            padding: 8px;
            border-right: 2px solid black;
            min-height: 60px;
        }
        .print-footer > div:last-child {
            border-right: none;
        }
        .print-footer-label {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 4px;
        }
        @page {
            size: A4;
            margin: 10mm;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>
        `;

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        await browser.close();

        console.log('✅ PDF généré avec succès');

        // Préparer les destinataires
        const recipients = process.env.EMAIL_RECIPIENTS.split(',').map(email => email.trim());

        // Préparer l'email
        const mailOptions = {
            from: `"Rapports Hebdomadaires" <${process.env.EMAIL_USER}>`,
            to: recipients.join(', '),
            subject: `Rapport Hebdomadaire - ${weekInfo.period} - ${weekInfo.foreman}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Rapport Hebdomadaire de Chantier</h2>
                    <p><strong>Période :</strong> ${weekInfo.period}</p>
                    <p><strong>Chef de chantier :</strong> ${weekInfo.foreman}</p>
                    <p><strong>Semaine :</strong> ${weekInfo.weekNumber}</p>
                    <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                    <p>Veuillez trouver ci-joint le rapport hebdomadaire des heures de chantier.</p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                        Ce message a été envoyé automatiquement depuis l'application de gestion des rapports hebdomadaires.
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: `Rapport_${weekInfo.weekNumber}_${weekInfo.period.replace(/\s/g, '_')}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        // Envoyer l'email
        console.log('📧 Envoi de l\'email...');
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email envoyé avec succès:', info.messageId);
        console.log('📬 Destinataires:', recipients.join(', '));

        res.json({ 
            success: true, 
            message: 'Rapport envoyé avec succès',
            recipients: recipients,
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'envoi du rapport',
            error: error.message 
        });
    }
});

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Serveur opérationnel',
        emailConfigured: !!process.env.EMAIL_USER,
        recipients: process.env.EMAIL_RECIPIENTS ? process.env.EMAIL_RECIPIENTS.split(',').length : 0
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📧 Email configuré: ${process.env.EMAIL_USER || 'NON CONFIGURÉ'}`);
    console.log(`📬 Nombre de destinataires: ${process.env.EMAIL_RECIPIENTS ? process.env.EMAIL_RECIPIENTS.split(',').length : 0}\n`);
});
