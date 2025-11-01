# Guide d'Installation - Rapports Hebdomadaires

## 🔒 Accès Sécurisé

⚠️ **IMPORTANT** : Cette application est protégée par un token d'accès.

Vous devez accéder à l'application avec une URL contenant le token :

```
http://localhost:3000/index.html?token=rapport2024secure
```

Sans le token, vous verrez une page "Accès Restreint".

---

Ce guide vous explique comment configurer l'envoi automatique de rapports par email.

## 📋 Prérequis

- Node.js version 14 ou supérieure ([Télécharger](https://nodejs.org/))
- Un compte email (Gmail recommandé)
- Les fichiers du projet

## 🚀 Installation Rapide

### Étape 1 : Installer les dépendances

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
npm install
```

Cette commande installera :
- Express (serveur web)
- Nodemailer (envoi d'emails)
- Puppeteer (génération PDF)
- Dotenv (gestion variables d'environnement)
- CORS et Body-parser (middleware)

### Étape 2 : Configurer les variables d'environnement

1. **Ouvrez le fichier `.env`** (déjà créé dans le projet)

2. **Modifiez les valeurs suivantes :**

```bash
# Votre email d'envoi
EMAIL_USER=votre.email@gmail.com

# Mot de passe d'application (voir étape 3)
EMAIL_PASSWORD=votre_mot_de_passe_application

# Liste des destinataires (séparés par des virgules)
EMAIL_RECIPIENTS=chef@example.com,comptable@example.com,direction@example.com
```

### Étape 3 : Configurer Gmail (recommandé)

#### A. Activer la validation en 2 étapes

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **Sécurité** dans le menu de gauche
3. Trouvez **Validation en 2 étapes** et activez-la
4. Suivez les instructions pour configurer votre téléphone

#### B. Générer un mot de passe d'application

1. Retournez dans **Sécurité**
2. Trouvez **Mots de passe d'application** (en bas de la section Validation en 2 étapes)
3. Sélectionnez **Autre (nom personnalisé)**
4. Entrez "Rapports Hebdomadaires"
5. Cliquez sur **Générer**
6. **Copiez le mot de passe de 16 caractères** (format: xxxx xxxx xxxx xxxx)
7. Collez-le dans le fichier `.env` → `EMAIL_PASSWORD` (sans espaces)

**⚠️ Important :** N'utilisez JAMAIS votre mot de passe Gmail principal !

### Étape 4 : Démarrer le serveur

Dans le terminal, exécutez :

```bash
npm start
```

Vous devriez voir :

```
🚀 Serveur démarré sur http://localhost:3000
📧 Email configuré: votre.email@gmail.com
📬 Nombre de destinataires: 3
✅ Serveur email prêt à envoyer des messages
```

### Étape 5 : Utiliser l'application

1. Ouvrez votre navigateur
2. Allez sur `http://localhost:3000/index.html`
3. Remplissez votre rapport
4. Cliquez sur le bouton orange **"Envoyer par Email"**
5. Le PDF sera généré et envoyé automatiquement ! 🎉

## 🔧 Configuration Avancée

### Utiliser un autre fournisseur d'email

Si vous n'utilisez pas Gmail, modifiez ces valeurs dans `.env` :

#### Outlook / Hotmail
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Yahoo
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Serveur SMTP personnalisé
```bash
EMAIL_HOST=smtp.votre-domaine.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Modifier le port du serveur

Par défaut, le serveur utilise le port 3000. Pour le changer :

```bash
PORT=8080
```

## 🔒 Sécurité

### ✅ Bonnes pratiques

- Le fichier `.env` contient vos credentials → **NE JAMAIS le commiter sur Git**
- Le `.gitignore` est déjà configuré pour exclure `.env`
- Utilisez toujours un mot de passe d'application, pas votre mot de passe principal
- Limitez les destinataires aux personnes autorisées

### ⚠️ À ne JAMAIS faire

- ❌ Commiter le fichier `.env` sur Git/GitHub
- ❌ Partager votre mot de passe d'application
- ❌ Utiliser votre mot de passe Gmail principal
- ❌ Laisser `EMAIL_RECIPIENTS` vide

## 🧪 Tester la Configuration

### Test 1 : Vérifier le serveur

Ouvrez `http://localhost:3000/api/test` dans votre navigateur.

Vous devriez voir :
```json
{
  "success": true,
  "message": "Serveur opérationnel",
  "emailConfigured": true,
  "recipients": 3
}
```

### Test 2 : Envoyer un rapport test

1. Remplissez un rapport simple avec un ouvrier
2. Cliquez sur "Envoyer par Email"
3. Vérifiez vos emails et ceux des destinataires

## ❓ Dépannage

### Erreur : "Impossible de se connecter au serveur"

**Solution :** Le serveur n'est pas démarré
```bash
npm start
```

### Erreur : "Invalid login"

**Causes possibles :**
1. Mauvais email ou mot de passe dans `.env`
2. Validation en 2 étapes non activée sur Gmail
3. Mot de passe d'application incorrect

**Solution :** Vérifiez vos credentials et régénérez un mot de passe d'application

### Erreur : "Cannot find module 'express'"

**Solution :** Les dépendances ne sont pas installées
```bash
npm install
```

### Le PDF est vide ou mal formaté

**Solution :** Vérifiez que vous avez :
- Sélectionné un chef de chantier
- Ajouté au moins un ouvrier
- Rempli les heures

### Puppeteer ne s'installe pas

**Solution Windows :**
```bash
npm install puppeteer --no-optional
```

**Solution Linux/Mac :**
```bash
sudo apt-get install -y chromium-browser
# ou
brew install chromium
```

## 📧 Format de l'Email Envoyé

### Sujet
```
Rapport Hebdomadaire - 01 - 05 Nov - Jean Dupont
```

### Corps
```
Rapport Hebdomadaire de Chantier

Période : 01 - 05 Nov
Chef de chantier : Jean Dupont
Semaine : S44-2024

Veuillez trouver ci-joint le rapport hebdomadaire des heures de chantier.
```

### Pièce jointe
```
Rapport_S44-2024_01-05_Nov.pdf
```

## 🎯 Prochaines Étapes

Une fois l'installation terminée :

1. ✅ Testez l'envoi avec un rapport simple
2. ✅ Vérifiez que tous les destinataires reçoivent l'email
3. ✅ Vérifiez que le PDF est correctement formaté
4. ✅ Configurez les destinataires définitifs dans `.env`
5. ✅ Utilisez l'application en production !

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez que Node.js est installé : `node --version`
2. Vérifiez que le serveur est démarré : `npm start`
3. Consultez les logs du serveur dans le terminal
4. Vérifiez le fichier `.env` (pas d'espaces, pas de guillemets)

---

**Félicitations ! 🎉** Votre système d'envoi de rapports par email est maintenant opérationnel !
