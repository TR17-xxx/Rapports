# 📦 Configuration Vercel + Brevo - Résumé Rapide

## ✅ Fichiers créés

- ✅ `api/send-report.js` - API Route Vercel pour l'envoi d'emails
- ✅ `vercel.json` - Configuration Vercel
- ✅ `.env.brevo` - Template de configuration Brevo
- ✅ `VERCEL_DEPLOYMENT.md` - Guide complet de déploiement

## 📋 Modifications effectuées

- ✅ `package.json` - Ajout de `@sparticuz/chromium` et `puppeteer-core`
- ✅ `.gitignore` - Ajout de `.vercel` et `.env.local`

---

## 🚀 Prochaines étapes

### 1. Installer les nouvelles dépendances

```bash
npm install
```

### 2. Créer vos comptes

#### Brevo (Service d'emailing)
1. Allez sur [brevo.com](https://www.brevo.com)
2. Inscrivez-vous (gratuit - 300 emails/jour)
3. Obtenez votre clé API :
   - Settings → SMTP & API → API Keys
   - Generate a new API key
   - Copiez la clé (format: `xkeysib-...`)
4. Configurez un email expéditeur :
   - Senders & IP → Add a sender
   - Vérifiez l'email

#### Vercel (Hébergement)
1. Allez sur [vercel.com](https://vercel.com)
2. Inscrivez-vous avec GitHub
3. Autorisez l'accès à vos repositories

### 3. Configurer votre .env local (pour tests)

Créez un fichier `.env` avec :

```shell
BREVO_API_KEY=xkeysib-votre_cle_api
BREVO_SENDER_EMAIL=votre.email@example.com
EMAIL_RECIPIENTS=destinataire1@example.com,destinataire2@example.com
```

### 4. Pousser sur GitHub

```bash
git add .
git commit -m "Configuration Vercel + Brevo"
git push origin main
```

### 5. Déployer sur Vercel

1. Dashboard Vercel → Add New → Project
2. Importez votre repository
3. Ajoutez les variables d'environnement :
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `EMAIL_RECIPIENTS`
4. Déployez !

### 6. Mettre à jour app.js

Trouvez la fonction `sendReportByEmail()` et changez l'URL :

```javascript
// Avant
const response = await fetch('http://localhost:3000/api/send-report', {

// Après
const response = await fetch('https://votre-projet.vercel.app/api/send-report', {
```

---

## 📚 Documentation complète

Consultez **VERCEL_DEPLOYMENT.md** pour le guide détaillé étape par étape.

---

## 💡 Avantages de cette solution

- ✅ **100% Gratuit** - Vercel + Brevo plans gratuits
- ✅ **Pas de mise en veille** - Contrairement à Render
- ✅ **Serverless** - Pas de serveur à gérer
- ✅ **Déploiement auto** - Push Git = déploiement
- ✅ **300 emails/jour** - Largement suffisant
- ✅ **HTTPS automatique** - Sécurisé par défaut
- ✅ **Service professionnel** - Brevo = plateforme d'emailing reconnue

---

## 🆚 Comparaison avec l'ancienne solution

| Critère | Vercel + Brevo | Server.js local |
|---------|----------------|-----------------|
| **Hébergement** | Cloud (Vercel) | Local uniquement |
| **Email** | API Brevo | SMTP Gmail |
| **Coût** | Gratuit | Gratuit |
| **Disponibilité** | 24/7 | Quand PC allumé |
| **Configuration** | Variables env | Fichier .env |
| **Maintenance** | Aucune | Serveur à lancer |

---

## ❓ Besoin d'aide ?

- 📖 Guide complet : `VERCEL_DEPLOYMENT.md`
- 🌐 Documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
- 📧 Documentation Brevo : [developers.brevo.com](https://developers.brevo.com)

---

**Bon déploiement ! 🎉**
