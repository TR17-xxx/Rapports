# 🚀 Guide de déploiement sur Netlify

Ce guide vous accompagne pas à pas pour déployer votre application de rapports hebdomadaires sur **Netlify** avec génération PDF via **PDFKit**.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration Brevo](#configuration-brevo)
3. [Déploiement sur Netlify](#déploiement-sur-netlify)
4. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
5. [Vérification du déploiement](#vérification-du-déploiement)
6. [Gestion et maintenance](#gestion-et-maintenance)
7. [Dépannage](#dépannage)

---

## 🎯 Prérequis

### Comptes nécessaires

- ✅ **Compte GitHub** (pour héberger le code)
- ✅ **Compte Netlify** (pour l'hébergement - gratuit)
- ✅ **Compte Brevo** (pour l'envoi d'emails - gratuit jusqu'à 300 emails/jour)

### Fichiers du projet

Votre projet contient déjà tous les fichiers nécessaires :
- ✅ `netlify.toml` - Configuration Netlify
- ✅ `netlify/functions/send-report.js` - Fonction serverless avec PDFKit
- ✅ `package.json` - Dépendances (PDFKit au lieu de Chromium)
- ✅ `app.js` - Frontend mis à jour pour Netlify

---

## 📧 Configuration Brevo

### 1. Créer un compte Brevo

1. Allez sur [brevo.com](https://www.brevo.com)
2. Cliquez sur **"Sign up free"**
3. Remplissez le formulaire d'inscription
4. Vérifiez votre email

### 2. Obtenir votre clé API

1. Connectez-vous à votre compte Brevo
2. Allez dans **"Settings"** (Paramètres) → **"SMTP & API"** → **"API Keys"**
3. Cliquez sur **"Generate a new API key"**
4. Donnez-lui un nom : `Rapports Hebdomadaires`
5. **Copiez la clé** (format : `xkeysib-...`)
   
   ⚠️ **Important** : Sauvegardez cette clé, elle ne sera affichée qu'une seule fois !

### 3. Configurer un email expéditeur

1. Dans Brevo, allez dans **"Senders & IP"** → **"Senders"**
2. Cliquez sur **"Add a sender"**
3. Entrez votre email professionnel (ex: `rapports@votreentreprise.com`)
4. **Vérifiez l'email** en cliquant sur le lien reçu

✅ Votre compte Brevo est prêt !

---

## 🌐 Déploiement sur Netlify

### 1. Préparer le code sur GitHub

Si ce n'est pas déjà fait, poussez votre code sur GitHub :

```bash
# Initialiser Git (si nécessaire)
git init

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Migration vers Netlify avec PDFKit"

# Ajouter votre repository distant
git remote add origin https://github.com/votre-username/votre-repo.git

# Pousser le code
git push -u origin main
```

### 2. Créer un compte Netlify

1. Allez sur [netlify.com](https://www.netlify.com)
2. Cliquez sur **"Sign up"**
3. Choisissez **"Sign up with GitHub"**
4. Autorisez Netlify à accéder à vos repositories

### 3. Importer votre projet

1. Dans le dashboard Netlify, cliquez sur **"Add new site"** → **"Import an existing project"**
2. Choisissez **"Deploy with GitHub"**
3. Sélectionnez votre repository
4. Configurez les paramètres de build :

   **Build settings** :
   - **Build command** : Laisser vide (pas de build nécessaire)
   - **Publish directory** : `.` (point)
   - **Functions directory** : `netlify/functions` (détecté automatiquement)

5. Cliquez sur **"Deploy site"**

⏳ Netlify va déployer votre site (cela prend 1-2 minutes)

---

## 🔐 Configuration des variables d'environnement

### 1. Accéder aux paramètres

1. Dans votre site Netlify, allez dans **"Site configuration"** → **"Environment variables"**
2. Cliquez sur **"Add a variable"**

### 2. Ajouter les variables

Ajoutez les 4 variables suivantes :

| Variable | Valeur | Exemple |
|----------|--------|---------|
| `BREVO_API_KEY` | Votre clé API Brevo | `xkeysib-abc123def456...` |
| `BREVO_SENDER_EMAIL` | Email expéditeur vérifié | `rapports@votreentreprise.com` |
| `EMAIL_RECIPIENTS` | Liste des destinataires (séparés par des virgules) | `chef@example.com,compta@example.com` |
| `ACCESS_TOKEN` | Token de sécurité personnalisé | `monTokenSecurise2024` |

**Pour chaque variable** :
1. Cliquez sur **"Add a variable"**
2. Entrez le **Key** (nom de la variable)
3. Entrez la **Value** (valeur)
4. Sélectionnez **"Same value for all deploy contexts"**
5. Cliquez sur **"Create variable"**

### 3. Redéployer le site

Après avoir ajouté les variables :
1. Allez dans **"Deploys"**
2. Cliquez sur **"Trigger deploy"** → **"Clear cache and deploy site"**

✅ Votre application est maintenant configurée !

---

## ✅ Vérification du déploiement

### 1. Obtenir l'URL de votre site

1. Dans le dashboard Netlify, vous verrez l'URL de votre site (ex: `https://votre-site-123abc.netlify.app`)
2. Vous pouvez personnaliser cette URL dans **"Site configuration"** → **"Domain management"**

### 2. Tester l'application

1. Ouvrez l'URL de votre site dans un navigateur
2. Créez un rapport hebdomadaire de test :
   - Sélectionnez un chef de chantier
   - Ajoutez des ouvriers
   - Remplissez les heures
   - Cliquez sur **"Envoyer par Email"**

3. Vérifiez que :
   - ✅ Le message de confirmation s'affiche
   - ✅ L'email est reçu par les destinataires
   - ✅ Le PDF est bien attaché et lisible

---

## 🔧 Gestion et maintenance

### Mettre à jour l'application

Chaque fois que vous poussez du code sur GitHub, Netlify redéploie automatiquement :

```bash
git add .
git commit -m "Description des modifications"
git push
```

⏳ Le déploiement prend 1-2 minutes

### Modifier les destinataires

1. Dashboard Netlify → **"Site configuration"** → **"Environment variables"**
2. Trouvez `EMAIL_RECIPIENTS`
3. Cliquez sur **"Options"** → **"Edit"**
4. Modifiez la liste (séparée par des virgules)
5. Cliquez sur **"Save"**
6. Redéployez : **"Deploys"** → **"Trigger deploy"**

### Configurer un domaine personnalisé

1. Dashboard Netlify → **"Site configuration"** → **"Domain management"**
2. Cliquez sur **"Add a domain"**
3. Entrez votre domaine : `rapports.votreentreprise.com`
4. Suivez les instructions pour configurer les DNS
5. Netlify génère automatiquement un certificat SSL (HTTPS)

### Consulter les logs

Pour déboguer les problèmes :
1. Dashboard Netlify → **"Functions"**
2. Cliquez sur `send-report`
3. Consultez les logs d'exécution

---

## ❓ Dépannage

### ⚠️ Erreur : "Configuration serveur incomplète"

**Cause** : Variables d'environnement manquantes ou mal configurées

**Solution** :
1. Vérifiez que les 4 variables sont bien définies dans Netlify
2. Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
3. Redéployez le site après modification

### ⚠️ Erreur : "Brevo API error"

**Cause** : Clé API invalide ou email expéditeur non vérifié

**Solution** :
1. Vérifiez que `BREVO_API_KEY` est correcte (format `xkeysib-...`)
2. Vérifiez que `BREVO_SENDER_EMAIL` est bien vérifié dans Brevo
3. Testez la clé API dans Brevo : **"Settings"** → **"SMTP & API"** → **"API Keys"**

### ⚠️ Erreur : "Token invalide"

**Cause** : Le token d'accès ne correspond pas

**Solution** :
1. Vérifiez la variable `ACCESS_TOKEN` dans Netlify
2. Si vous n'avez pas défini de token, la valeur par défaut est `rapport2024secure`
3. Assurez-vous que le frontend utilise le même token

### ⚠️ Erreur : "Failed to fetch"

**Cause** : Problème de connexion ou fonction Netlify non déployée

**Solution** :
1. Vérifiez que le site est bien déployé (statut "Published")
2. Vérifiez que le dossier `netlify/functions` existe dans votre repository
3. Consultez les logs de fonction dans Netlify
4. Testez l'URL de la fonction directement : `https://votre-site.netlify.app/.netlify/functions/send-report`

### ⚠️ PDF vide ou mal formaté

**Cause** : Données manquantes ou mal structurées

**Solution** :
1. Vérifiez que tous les champs sont remplis (chef de chantier, ouvriers, heures)
2. Consultez les logs de la fonction pour voir les erreurs
3. Vérifiez que les noms de chantiers ne sont pas vides

### ⚠️ Timeout de fonction

**Cause** : La fonction prend trop de temps (limite : 10s en gratuit)

**Solution** :
1. PDFKit est très rapide, ce problème ne devrait pas arriver
2. Si vous avez beaucoup d'ouvriers (>50), envisagez de passer à Netlify Pro (26s de timeout)
3. Optimisez en réduisant le nombre de pages générées

---

## 💡 Avantages de cette solution

### ✅ Performance

- **Génération PDF ultra-rapide** : PDFKit génère un PDF en <1 seconde
- **Pas de dépendances lourdes** : ~500KB vs 50MB pour Chromium
- **Démarrage instantané** : Pas de lancement de navigateur

### ✅ Fiabilité

- **100% compatible Netlify** : Fonctionne parfaitement sur serverless
- **Pas de problèmes de binaires** : Pure JavaScript, pas de dépendances système
- **Pas de timeout** : Génération en <1s, bien en dessous de la limite de 10s

### ✅ Coût

- **Totalement gratuit** : Netlify + Brevo plans gratuits suffisants
- **300 emails/jour** : Largement suffisant pour des rapports hebdomadaires
- **Pas de limite de taille** : PDFKit ne pose aucun problème de taille de fonction

### ✅ Maintenance

- **Déploiement automatique** : Push Git = déploiement
- **HTTPS automatique** : Sécurisé par défaut
- **Pas de serveur à gérer** : Architecture serverless

---

## 🆚 Comparaison Vercel vs Netlify

| Critère | Vercel (Chromium) | Netlify (PDFKit) |
|---------|-------------------|------------------|
| **Taille fonction** | ~50MB | ~500KB |
| **Temps génération** | 3-5s | <1s |
| **Timeout gratuit** | 10s | 10s |
| **Compatibilité** | ⚠️ Problèmes fréquents | ✅ Parfaite |
| **Maintenance** | ⚠️ Mises à jour Chromium | ✅ Aucune |
| **Qualité PDF** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 📚 Ressources

- 📖 [Documentation Netlify](https://docs.netlify.com)
- 📖 [Documentation Netlify Functions](https://docs.netlify.com/functions/overview/)
- 📖 [Documentation Brevo API](https://developers.brevo.com)
- 📖 [Documentation PDFKit](https://pdfkit.org)

---

## 🎉 Félicitations !

Votre application de rapports hebdomadaires est maintenant déployée sur Netlify avec une génération PDF optimisée !

**Prochaines étapes** :
1. ✅ Testez l'envoi d'un rapport
2. ✅ Configurez un domaine personnalisé (optionnel)
3. ✅ Partagez l'URL avec votre équipe

**Besoin d'aide ?** Consultez la section [Dépannage](#dépannage) ou les logs Netlify.
