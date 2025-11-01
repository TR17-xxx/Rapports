const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

// Configuration Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Access-Token'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

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
        
        // Vérifier les variables d'environnement requises
        if (!BREVO_API_KEY) {
            console.error('❌ BREVO_API_KEY manquante');
            return res.status(500).json({ 
                success: false, 
                message: 'Configuration serveur incomplète: BREVO_API_KEY manquante. Veuillez configurer les variables d\'environnement dans Vercel.' 
            });
        }
        
        if (!process.env.BREVO_SENDER_EMAIL) {
            console.error('❌ BREVO_SENDER_EMAIL manquante');
            return res.status(500).json({ 
                success: false, 
                message: 'Configuration serveur incomplète: BREVO_SENDER_EMAIL manquante. Veuillez configurer les variables d\'environnement dans Vercel.' 
            });
        }
        
        if (!process.env.EMAIL_RECIPIENTS) {
            console.error('❌ EMAIL_RECIPIENTS manquante');
            return res.status(500).json({ 
                success: false, 
                message: 'Configuration serveur incomplète: EMAIL_RECIPIENTS manquante. Veuillez configurer les variables d\'environnement dans Vercel.' 
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

        // Générer le PDF avec Puppeteer (optimisé pour Vercel)
        let browser;
        try {
            browser = await puppeteer.launch({
                args: [
                    ...chromium.args,
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process',
                    '--no-zygote'
                ],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless || 'new',
                ignoreHTTPSErrors: true,
            });
            console.log('✅ Navigateur lancé avec succès');
        } catch (launchError) {
            console.error('❌ Erreur lors du lancement du navigateur:', launchError);
            throw new Error(`Impossible de lancer le navigateur: ${launchError.message}`);
        }

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

        if (browser) {
            await browser.close();
        }

        console.log('✅ PDF généré avec succès');

        // Préparer les destinataires
        const recipients = process.env.EMAIL_RECIPIENTS.split(',').map(email => email.trim());

        // Convertir le PDF en base64 pour Brevo
        const pdfBase64 = pdfBuffer.toString('base64');

        // Préparer l'email pour Brevo
        const emailData = {
            sender: {
                name: "Rapports Hebdomadaires",
                email: process.env.BREVO_SENDER_EMAIL
            },
            to: recipients.map(email => ({ email })),
            subject: `Rapport Hebdomadaire - ${weekInfo.period} - ${weekInfo.foreman}`,
            htmlContent: `
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
            attachment: [
                {
                    name: `Rapport_${weekInfo.weekNumber}_${weekInfo.period.replace(/\s/g, '_')}.pdf`,
                    content: pdfBase64
                }
            ]
        };

        // Envoyer l'email via Brevo API
        console.log('📧 Envoi de l\'email via Brevo...');
        
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
            const errorText = await brevoResponse.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { message: errorText };
            }
            
            console.error('❌ Erreur Brevo API:', errorData);
            
            // Messages d'erreur plus explicites
            let errorMessage = 'Erreur lors de l\'envoi via Brevo';
            if (brevoResponse.status === 401) {
                errorMessage = 'Clé API Brevo invalide. Vérifiez BREVO_API_KEY dans les variables d\'environnement.';
            } else if (brevoResponse.status === 400) {
                errorMessage = `Configuration email invalide: ${errorData.message || JSON.stringify(errorData)}`;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            }
            
            throw new Error(errorMessage);
        }

        const brevoResult = await brevoResponse.json();

        console.log('✅ Email envoyé avec succès via Brevo:', brevoResult.messageId);
        console.log('📬 Destinataires:', recipients.join(', '));

        res.status(200).json({ 
            success: true, 
            message: 'Rapport envoyé avec succès',
            recipients: recipients,
            messageId: brevoResult.messageId
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'envoi du rapport',
            error: error.message 
        });
    }
};
