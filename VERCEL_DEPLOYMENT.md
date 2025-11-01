# 🚀 Guide de Déploiement Vercel + Brevo

Ce guide vous explique comment déployer votre application de rapports hebdomadaires sur **Vercel** avec l'envoi d'emails via **Brevo** (100% gratuit).

---

## 📋 Prérequis

- ✅ Compte GitHub (pour héberger le code)
- ✅ Compte Vercel (gratuit)
- ✅ Compte Brevo (gratuit - 300 emails/jour)

---

## 🎯 Étape 1 : Créer un compte Brevo

### 1.1 Inscription

1. Allez sur [brevo.com](https://www.brevo.com) (anciennement Sendinblue)
2. Cliquez sur **"Sign up free"**
3. Remplissez le formulaire :
   - Email professionnel
   - Mot de passe
   - Nom de l'entreprise
4. Confirmez votre email

**Plan gratuit** : 300 emails/jour - Parfait pour vos rapports !

### 1.2 Obtenir la clé API

1. Connectez-vous à votre compte Brevo
2. Cliquez sur **"Settings"** (⚙️ en haut à droite)
3. Dans le menu de gauche : **"SMTP & API"**
4. Onglet **"API Keys"**
5. Cliquez sur **"Generate a new API key"**
6. Nom : `Rapports Hebdomadaires`
7. **Copiez la clé** (format : `xkeysib-...`)

⚠️ **Important** : Sauvegardez cette clé immédiatement, elle ne sera plus visible !

### 1.3 Configurer l'email expéditeur

1. Dans Brevo, allez dans **"Senders & IP"**
2. Cliquez sur **"Add a sender"**
3. Remplissez :
   - **From Name** : `Rapports Hebdomadaires`
   - **From Email** : Votre email professionnel (ex: `rapports@votreentreprise.com`)
4. Vérifiez l'email (cliquez sur le lien reçu)

✅ Votre email expéditeur est maintenant vérifié !

---

## 🎯 Étape 2 : Préparer le code pour GitHub

### 2.1 Initialiser Git (si pas déjà fait)

Ouvrez un terminal dans le dossier du projet :

```bash
git init
git add .
git commit -m "Configuration Vercel + Brevo"
```

### 2.2 Créer un repository sur GitHub

1. Allez sur [github.com](https://github.com)
2. Cliquez sur **"New repository"** (bouton vert)
3. Nom : `rapport-hebdomadaire`
4. Visibilité : **Private** (recommandé)
5. Cliquez sur **"Create repository"**

### 2.3 Pousser le code sur GitHub

Copiez les commandes affichées par GitHub :

```bash
git remote add origin https://github.com/VOTRE_USERNAME/rapport-hebdomadaire.git
git branch -M main
git push -u origin main
```

✅ Votre code est maintenant sur GitHub !

---

## 🎯 Étape 3 : Déployer sur Vercel

### 3.1 Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"**
3. Choisissez **"Continue with GitHub"**
4. Autorisez Vercel à accéder à vos repositories

### 3.2 Importer le projet

1. Dans le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
2. Trouvez votre repository **rapport-hebdomadaire**
3. Cliquez sur **"Import"**

### 3.3 Configurer le projet

**Framework Preset** : `Other` (laisser par défaut)

**Root Directory** : `.` (laisser par défaut)

**Build Command** : Laisser vide

**Output Directory** : Laisser vide

### 3.4 Ajouter les variables d'environnement

Dans la section **"Environment Variables"**, ajoutez :

| Name | Value | Exemple |
|------|-------|---------|
| `BREVO_API_KEY` | Votre clé API Brevo | `xkeysib-abc123...` |
| `BREVO_SENDER_EMAIL` | Email expéditeur vérifié | `rapports@votreentreprise.com` |
| `EMAIL_RECIPIENTS` | Liste des destinataires | `chef@example.com,compta@example.com` |

**Pour chaque variable** :
1. Entrez le **Name**
2. Entrez la **Value**
3. Cochez **Production**, **Preview**, et **Development**
4. Cliquez sur **"Add"**

### 3.5 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez la fin du déploiement (~2-3 minutes)
3. ✅ Vous verrez : **"Congratulations! Your project has been deployed"**
4. Notez l'URL : `https://votre-projet.vercel.app`

---

## 🎯 Étape 4 : Mettre à jour le frontend

### 4.1 Trouver la fonction d'envoi d'email

Ouvrez le fichier `app.js` et cherchez la fonction `sendReportByEmail()` (environ ligne 1500+).

### 4.2 Modifier l'URL de l'API

Trouvez cette ligne :

```javascript
const response = await fetch('http://localhost:3000/api/send-report', {
```

Remplacez par votre URL Vercel :

```javascript
const response = await fetch('https://votre-projet.vercel.app/api/send-report', {
```

**Exemple complet** :

```javascript
async function sendReportByEmail() {
    try {
        showEmailModal('Génération du PDF en cours...');
        
        const printContent = document.getElementById('print-content');
        const weekPeriod = document.getElementById('week-period').textContent;
        const foremanName = document.getElementById('foreman-name').textContent;
        const weekNumber = document.getElementById('week-number').textContent;
        
        const response = await fetch('https://votre-projet.vercel.app/api/send-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                htmlContent: printContent.innerHTML,
                weekInfo: {
                    period: weekPeriod,
                    foreman: foremanName,
                    weekNumber: weekNumber
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showEmailModal(`✅ Rapport envoyé avec succès !<br><br>Destinataires : ${result.recipients.join(', ')}`);
        } else {
            showEmailModal(`❌ Erreur : ${result.message}`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showEmailModal('❌ Erreur lors de l\'envoi du rapport');
    }
}
```

### 4.3 Sauvegarder et pousser les modifications

```bash
git add app.js
git commit -m "Mise à jour URL API Vercel"
git push origin main
```

Vercel redéploiera automatiquement votre application ! 🎉

---

## 🧪 Étape 5 : Tester l'application

### 5.1 Tester l'API directement

Ouvrez dans votre navigateur :

```
https://votre-projet.vercel.app/api/send-report
```

Vous devriez voir :
```json
{
  "success": false,
  "message": "Method not allowed"
}
```

C'est normal ! L'API n'accepte que les requêtes POST.

### 5.2 Tester l'envoi complet

1. Ouvrez votre application : `https://votre-projet.vercel.app/index.html`
2. Remplissez un rapport test avec :
   - Sélection de la semaine
   - Chef de chantier
   - Au moins un ouvrier avec des heures
3. Cliquez sur **"Envoyer par Email"** (bouton orange)
4. Attendez le message de confirmation
5. Vérifiez vos emails et ceux des destinataires

✅ Si vous recevez l'email avec le PDF, tout fonctionne parfaitement !

---

## 📊 Surveillance et Logs

### Voir les logs Vercel

1. Dashboard Vercel → Votre projet
2. Onglet **"Deployments"**
3. Cliquez sur le dernier déploiement
4. Onglet **"Functions"** → Cliquez sur `/api/send-report`
5. Vous verrez tous les logs d'exécution

### Voir les statistiques Brevo

1. Dashboard Brevo → **"Statistics"**
2. Vous verrez :
   - Nombre d'emails envoyés
   - Taux d'ouverture
   - Taux de clics
   - Emails restants aujourd'hui

---

## 🔧 Configuration Avancée

### Ajouter un domaine personnalisé

1. Dashboard Vercel → Votre projet → **"Settings"** → **"Domains"**
2. Ajoutez votre domaine : `rapports.votreentreprise.com`
3. Configurez les DNS selon les instructions Vercel
4. Mettez à jour l'URL dans `app.js`

### Modifier les destinataires

1. Dashboard Vercel → Votre projet → **"Settings"** → **"Environment Variables"**
2. Trouvez `EMAIL_RECIPIENTS`
3. Cliquez sur **"Edit"**
4. Modifiez la liste (séparée par des virgules)
5. Cliquez sur **"Save"**
6. Redéployez : **"Deployments"** → **"Redeploy"**

---

## ❓ Dépannage

### ⚠️ Erreur : "libnss3.so: cannot open shared object file"

**Erreur complète** : `Error: Failed to launch the browser process: Code 127`

**Cause** : Version incompatible de `@sparticuz/chromium` avec Vercel ou bibliothèques système manquantes.

**Solution** :

1. **Vérifiez les versions dans `package.json`** (déjà corrigé dans ce projet) :
   ```json
   "@sparticuz/chromium": "^119.0.2",
   "puppeteer-core": "^21.6.1"
   ```
   ⚠️ Les versions 119-120 sont plus stables sur Vercel que la 131.

2. **Réinstallez les dépendances** :
   ```bash
   npm install
   ```

3. **Commitez et poussez les changements** :
   ```bash
   git add .
   git commit -m "Fix: Update Chromium to v119 for Vercel compatibility"
   git push
   ```

4. **Vercel redéploiera automatiquement** avec les bonnes versions.

5. **Vérifiez la configuration `vercel.json`** :
   - `memory: 3008` (nécessaire pour Chromium)
   - `maxDuration: 60` (génération PDF peut prendre du temps)
   - `includeFiles` inclut les binaires Chromium

### Erreur : "Brevo API error"

**Cause** : Clé API invalide ou email expéditeur non vérifié

**Solution** :
1. Vérifiez que `BREVO_API_KEY` est correcte dans Vercel
2. Vérifiez que `BREVO_SENDER_EMAIL` est vérifié dans Brevo
3. Redéployez l'application

### Erreur : "Function execution timeout"

**Cause** : La génération du PDF prend trop de temps

**Solution** : 
1. Normal pour le premier appel (cold start). Réessayez.
2. Si le problème persiste, réduisez le nombre d'ouvriers par rapport.

### Les emails n'arrivent pas

**Vérifications** :
1. Vérifiez les logs Vercel (voir section Surveillance)
2. Vérifiez les statistiques Brevo
3. Vérifiez les spams
4. Vérifiez que `EMAIL_RECIPIENTS` est correct

### Le PDF est vide

**Cause** : Contenu HTML mal formaté

**Solution** : Assurez-vous d'avoir :
- Sélectionné un chef de chantier
- Ajouté au moins un ouvrier
- Rempli des heures

---

## 💰 Limites du Plan Gratuit

### Vercel (Plan Hobby)
- ✅ 100 GB de bande passante/mois
- ✅ Déploiements illimités
- ✅ HTTPS automatique
- ✅ Pas de mise en veille
- ⚠️ Timeout de 10 secondes par fonction

### Brevo (Plan Free)
- ✅ 300 emails/jour
- ✅ Contacts illimités
- ✅ Templates d'emails
- ⚠️ Logo Brevo dans les emails (version gratuite)

**Pour vos rapports hebdomadaires** : Largement suffisant ! 🎉

---

## 🎉 Félicitations !

Votre système d'envoi de rapports est maintenant :
- ✅ 100% gratuit
- ✅ Hébergé sur Vercel (serverless)
- ✅ Emails via Brevo (service professionnel)
- ✅ Déploiement automatique sur Git push
- ✅ HTTPS sécurisé
- ✅ Pas de serveur à gérer

---

## 📞 Support

**Problèmes avec Vercel** : [vercel.com/support](https://vercel.com/support)

**Problèmes avec Brevo** : [help.brevo.com](https://help.brevo.com)

**Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)

**Documentation Brevo API** : [developers.brevo.com](https://developers.brevo.com)

---

**Bon déploiement ! 🚀**
