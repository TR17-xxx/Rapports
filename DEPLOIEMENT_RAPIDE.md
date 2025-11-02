# 🚀 Guide de Déploiement Rapide - Netlify

## ✅ Correction appliquée
Le problème d'envoi d'email a été corrigé en remplaçant PDFKit par jsPDF + jspdf-autotable.

## 📋 Étapes de déploiement

### 1. Commit et push des modifications
```bash
git add .
git commit -m "Fix: Remplacer PDFKit par jsPDF pour compatibilité Netlify"
git push origin main
```

### 2. Configurer les variables d'environnement sur Netlify

Allez sur votre dashboard Netlify : **Site settings** → **Environment variables**

Ajoutez les variables suivantes :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `BREVO_API_KEY` | `xkeysib-...` | Votre clé API Brevo (https://app.brevo.com/settings/keys/api) |
| `BREVO_SENDER_EMAIL` | `rapports@votredomaine.com` | Email expéditeur (doit être vérifié dans Brevo) |
| `EMAIL_RECIPIENTS` | `email1@example.com,email2@example.com` | Destinataires séparés par des virgules |
| `ACCESS_TOKEN` | `rapport2024secure` | Token d'accès pour sécuriser l'application |

### 3. Redéployer le site

Netlify devrait déployer automatiquement après le push. Sinon :
- Allez dans **Deploys**
- Cliquez sur **Trigger deploy** → **Deploy site**

### 4. Tester l'envoi d'email

1. Accédez à votre site : `https://votre-site.netlify.app/?token=rapport2024secure`
2. Sélectionnez un chef de chantier
3. Ajoutez des ouvriers
4. Remplissez les heures
5. Cliquez sur **Envoyer par Email**

## 🔍 Vérification

### Vérifier les logs Netlify
1. Allez dans **Functions** → **send-report**
2. Consultez les logs pour voir les messages :
   - `📧 Génération du PDF avec jsPDF...`
   - `✅ PDF généré avec succès, taille: XXX bytes`
   - `📤 Envoi de l'email via Brevo...`
   - `✅ Email envoyé avec succès`

### En cas d'erreur

#### Erreur : "BREVO_API_KEY manquante"
→ Vérifiez que la variable est bien configurée dans Netlify

#### Erreur : "Token invalide"
→ Vérifiez que le token dans l'URL correspond à `ACCESS_TOKEN`

#### Erreur : "Erreur Brevo API"
→ Vérifiez que :
- Votre clé API Brevo est valide
- L'email expéditeur est vérifié dans Brevo
- Vous n'avez pas dépassé votre quota d'emails

## 📊 Différences avec PDFKit

| Aspect | PDFKit (❌ Ancien) | jsPDF (✅ Nouveau) |
|--------|-------------------|-------------------|
| Compatibilité serverless | ❌ Non | ✅ Oui |
| Fichiers externes requis | ❌ Oui (polices, licences) | ✅ Non (tout intégré) |
| Taille des dépendances | 160 packages | 125 packages (-35) |
| Syntaxe | Complexe | Simple et directe |
| Maintenance | Difficile | Facile |
| Popularité | 2M/semaine | 3.5M/semaine |

## 🎉 Résultat

Après le déploiement, vous pourrez :
- ✅ Générer des rapports PDF
- ✅ Envoyer les rapports par email via Brevo
- ✅ Recevoir les PDF en pièce jointe
- ✅ Tout fonctionne sur Netlify Functions

## 📞 Support

En cas de problème, consultez :
- Les logs Netlify Functions
- Le fichier `CHANGELOG_FIX.md` pour plus de détails techniques
- La documentation Brevo : https://developers.brevo.com/
