# Application de Rapports Hebdomadaires de Chantier

Application web simple pour gérer les rapports hebdomadaires des ouvriers de chantier.

---

## 🚨 Sécurité GitHub - CRITIQUE

### ⚠️ Repository Public = DANGER

Si votre repository GitHub est **public**, **TOUTES** les informations dans votre code sont visibles par n'importe qui, y compris :

- ❌ Adresses email dans `.env`
- ❌ Mots de passe
- ❌ Clés API
- ❌ Tokens d'accès

### ✅ Solution : Fichiers `.env` JAMAIS dans Git

**Vérification immédiate** - Exécutez cette commande :

```bash
git ls-files | grep .env
```

- **Aucun résultat** → ✅ Vous êtes en sécurité
- **Des fichiers apparaissent** → ❌ **ILS SONT PUBLICS !** Suivez les étapes ci-dessous

### 🚨 Si vous avez déjà commité des fichiers `.env`

**ACTION IMMDIATE** :

1. **Rendre le repository privé** (GitHub → Settings → Change visibility → Private)

2. **Changer TOUS les secrets** :
   - Générer un nouveau mot de passe d'application email
   - Générer une nouvelle clé API Brevo
   - Générer un nouveau token d'accès

3. **Supprimer les fichiers de Git** :

   ```bash
   # Option simple : Nouveau repository
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit (sans secrets)"
   ```

### Protection pour l'avenir

✅ **Vérifiez `.gitignore`** contient :
```gitignore
.env
.env.local
.env.brevo
.env.*
```

✅ **Avant chaque commit** :
```bash
git status  # Vérifier qu'aucun .env n'apparaît
```

✅ **Utilisez `.env.example`** avec des valeurs factices (peut être commité)

### Configuration Vercel (Production)

Sur Vercel, configurez les variables d'environnement :

1. Dashboard → Settings → **Environment Variables**
2. Ajoutez : `ACCESS_TOKEN`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `EMAIL_RECIPIENTS`

✅ Les secrets ne sont **jamais** dans le code !

---

## 🔒 Sécurité et Accès

### ⚠️ IMPORTANT : Accès Protégé par Token

Cette application est **protégée par un système de token d'accès**. Seules les personnes disposant du lien avec le token valide peuvent accéder à l'application. Cette protection est nécessaire car l'application utilise l'envoi d'emails.

### Comment accéder à l'application ?

Vous devez utiliser une URL avec le paramètre `token` :

**En local :**
```
http://localhost:3000/index.html?token=rapport2024secure
```

**En production :**
```
https://votre-domaine.com/index.html?token=rapport2024secure
```

❌ **Sans le token, vous verrez une page "Accès Restreint"**

### Configuration du token (Administrateurs)

#### 1. Générer un token sécurisé

Pour générer un token aléatoire et sécurisé :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Exemple de résultat :
```
a7f3c8e9d2b1f4a6c8e7d9b2f1a4c6e8d9b2f1a4c6e8d9b2f1a4c6e8d9b2f1a4
```

#### 2. Configurer le token dans `.env`

Ajoutez ou modifiez dans votre fichier `.env` :

```bash
# Token d'accès (doit correspondre au token dans index.html)
ACCESS_TOKEN=a7f3c8e9d2b1f4a6c8e7d9b2f1a4c6e8d9b2f1a4c6e8d9b2f1a4c6e8d9b2f1a4
```

#### 3. Configurer le token dans `index.html`

Ouvrez `index.html` et modifiez la ligne ~488 :

```javascript
const REQUIRED_TOKEN = 'a7f3c8e9d2b1f4a6c8e7d9b2f1a4c6e8d9b2f1a4c6e8d9b2f1a4c6e8d9b2f1a4';
```

⚠️ **Les deux tokens doivent être IDENTIQUES** (dans `.env` et `index.html`)

#### 4. Redémarrer le serveur

```bash
npm start
```

### Partager l'accès

Pour donner accès à une personne, partagez-lui l'URL complète avec le token :

```
https://votre-domaine.com/index.html?token=votre_token_ici
```

⚠️ **Bonnes pratiques :**
- Ne partagez le lien qu'avec des personnes de confiance
- Changez le token régulièrement (tous les 3-6 mois)
- Utilisez HTTPS en production
- Ne publiez jamais le token publiquement

### Révoquer l'accès

Pour révoquer tous les accès existants :

1. Générez un nouveau token
2. Mettez à jour `.env` et `index.html`
3. Redémarrez le serveur
4. Partagez le nouveau lien uniquement aux personnes autorisées

---

## Fonctionnalités

- ✅ Saisie des heures du lundi au vendredi
- ✅ Heures pré-remplies à 7.5h par jour
- ✅ Gestion de plusieurs chantiers par ouvrier
- ✅ Désignation du conducteur de la semaine
- ✅ **Gestion flexible du panier** (Panier, Grand déplacement, Personnaliser)
- ✅ Calcul automatique des totaux par ouvrier
- ✅ Calcul automatique des totaux par chantier
- ✅ Impression / Export PDF
- ✅ Ajout dynamique d'ouvriers
- ✅ **Envoi automatique par email** avec génération PDF

## Installation

### Mode Simple (sans envoi d'emails)

Aucune installation nécessaire ! Il suffit d'ouvrir le fichier `index.html` dans un navigateur web moderne (Chrome, Firefox, Edge, Safari).

### Mode Complet (avec envoi d'emails)

Pour utiliser la fonctionnalité d'envoi automatique par email :

1. **Installer Node.js** (version 14 ou supérieure)
   - Télécharger depuis [nodejs.org](https://nodejs.org/)

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   - Copier le fichier `.env.example` vers `.env`
   - Éditer le fichier `.env` avec vos informations :
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=votre.email@gmail.com
   EMAIL_PASSWORD=votre_mot_de_passe_application
   EMAIL_RECIPIENTS=destinataire1@example.com,destinataire2@example.com
   PORT=3000
   ```

4. **Configuration Gmail (si vous utilisez Gmail)**
   - Activer la validation en 2 étapes sur votre compte Google
   - Générer un "Mot de passe d'application" :
     1. Aller dans les paramètres de votre compte Google
     2. Sécurité → Validation en 2 étapes → Mots de passe d'application
     3. Créer un nouveau mot de passe pour "Autre (nom personnalisé)"
     4. Utiliser ce mot de passe dans `EMAIL_PASSWORD`

5. **Démarrer le serveur**
   ```bash
   npm start
   ```
   Le serveur démarre sur `http://localhost:3000`

6. **Ouvrir l'application**
   - Ouvrir `http://localhost:3000/index.html` dans votre navigateur

## Utilisation

### 1. Configuration de la semaine

1. **Sélectionner la semaine** : Utilisez le sélecteur de semaine en haut de la page
2. **Choisir le conducteur** : Sélectionnez qui est le conducteur pour cette semaine
3. **Ajouter des ouvriers** : Cliquez sur "Ajouter un ouvrier" si nécessaire

### 2. Saisie des heures

Pour chaque ouvrier :

1. **Entrer le nom du chantier** dans le champ prévu
2. **Modifier les heures** si elles diffèrent de 7.5h (pré-remplies par défaut)
3. **Ajouter un chantier** si l'ouvrier a travaillé sur plusieurs chantiers dans la semaine
4. **Configurer le panier** : Sélectionnez le mode de panier approprié (voir section ci-dessous)
5. Les totaux se calculent automatiquement

### 2.1. Gestion du panier

Pour chaque ouvrier, vous pouvez choisir le mode de gestion du panier via le menu déroulant "Panier" :

#### Option 1 : Panier (par défaut)
- La ligne "PANIER" dans la fiche de pointage sera remplie avec **"1"** pour chaque jour travaillé
- Utilisez cette option pour les ouvriers bénéficiant du panier standard

#### Option 2 : Grand déplacement
- La ligne "PANIER" dans la fiche de pointage sera remplie avec **"GD"** pour chaque jour travaillé
- Utilisez cette option pour les ouvriers en grand déplacement

#### Option 3 : Personnaliser
- Une nouvelle ligne de sélection apparaît sous le menu déroulant
- Pour chaque jour (Lun, Mar, Mer, Jeu, Ven), choisissez entre :
  - **0** : Pas de panier ce jour
  - **1** : Panier standard
  - **GD** : Grand déplacement
- Les valeurs personnalisées ne s'affichent que pour les jours où l'ouvrier a travaillé

### 3. Cas d'usage courants

#### Ouvrier sur un seul chantier toute la semaine
- Entrez simplement le nom du chantier
- Les heures sont déjà pré-remplies à 7.5h
- Modifiez uniquement si nécessaire

#### Ouvrier sur plusieurs chantiers
- Entrez le premier chantier avec ses heures
- Cliquez sur "+ Ajouter un chantier"
- Entrez le deuxième chantier avec ses heures
- Mettez à 0 les jours non travaillés sur chaque chantier

#### Ouvrier absent un jour
- Mettez 0 dans la case du jour d'absence

### 4. Export et impression

#### Impression / PDF Local
1. **Imprimer** : Cliquez sur le bouton "Imprimer / PDF" en haut à droite
2. **Enregistrer en PDF** : Dans la fenêtre d'impression, choisissez "Enregistrer au format PDF"
3. Le rapport inclut :
   - La période de la semaine
   - Le conducteur désigné
   - Le détail par ouvrier et chantier
   - Les lignes PANIER (selon le mode choisi), TRANSPORT et TRAJET
   - Les observations et statut intérimaire
   - Les tableaux récapitulatifs

#### Envoi par Email (nécessite le serveur)
1. **Configurer les destinataires** : Modifier la variable `EMAIL_RECIPIENTS` dans le fichier `.env`
2. **Démarrer le serveur** : `npm start`
3. **Cliquer sur "Envoyer par Email"** : Le rapport sera automatiquement :
   - Converti en PDF
   - Envoyé aux adresses configurées
   - Avec un nom de fichier automatique : `Rapport_S42-2024_01-05_Nov.pdf`

**Avantages de l'envoi par email :**
- ✅ Envoi simultané à plusieurs destinataires
- ✅ PDF généré automatiquement
- ✅ Nom de fichier standardisé
- ✅ Email professionnel avec informations du rapport
- ✅ Credentials email protégés par variables d'environnement

## Personnalisation

### Modifier la liste des ouvriers par défaut

Ouvrez le fichier `app.js` et modifiez la section suivante :

```javascript
const defaultWorkers = [
    { id: 1, firstName: "Jean", lastName: "Dupont" },
    { id: 2, firstName: "Marie", lastName: "Martin" },
    { id: 3, firstName: "Pierre", lastName: "Durand" },
    { id: 4, firstName: "Sophie", lastName: "Bernard" },
    { id: 5, firstName: "Luc", lastName: "Petit" }
];
```

Ajoutez, modifiez ou supprimez des ouvriers selon vos besoins. N'oubliez pas d'incrémenter les IDs de manière unique.

### Modifier les heures par défaut

Dans le fichier `app.js`, trouvez la fonction `createEmptySite()` et modifiez les valeurs :

```javascript
function createEmptySite() {
    return {
        siteName: '',
        hours: {
            monday: 7.5,    // Modifiez ici
            tuesday: 7.5,   // Modifiez ici
            wednesday: 7.5, // Modifiez ici
            thursday: 7.5,  // Modifiez ici
            friday: 7.5     // Modifiez ici
        }
    };
}
```

## Compatibilité Mobile

### Systèmes supportés

#### iOS
- ✅ **iOS 9.0+** : Support complet
- ✅ **iOS 10.0+** : Support optimal
- ✅ **Safari Mobile** : Toutes versions récentes
- ✅ **Chrome iOS** : Toutes versions récentes

#### Android
- ✅ **Android 4.4 (KitKat)+** : Support complet avec polyfills
- ✅ **Android 5.0 (Lollipop)+** : Support optimal
- ✅ **Chrome Android** : Toutes versions récentes
- ✅ **Firefox Android** : Toutes versions récentes
- ✅ **Samsung Internet** : Versions 4.0+

### Fonctionnalités mobiles optimisées

✅ **Interface responsive** adaptée aux petits écrans
✅ **Prévention du zoom automatique** sur iOS lors de la saisie
✅ **Zones tactiles optimisées** (minimum 44px selon recommandations Apple/Google)
✅ **Support des gestes tactiles** (scroll, tap, swipe)
✅ **Modals adaptés** pour mobile avec fermeture par backdrop
✅ **Impression mobile** compatible iOS et Android
✅ **Performance optimisée** pour les anciens appareils
✅ **Polyfills inclus** pour les anciennes versions de navigateurs

### Utilisation sur smartphone/tablette

1. **Ouvrir l'application** :
   - iOS : Safari ou Chrome
   - Android : Chrome, Firefox ou Samsung Internet

2. **Navigation** :
   - L'interface s'adapte automatiquement à la taille de l'écran
   - Les boutons sont optimisés pour le tactile
   - Pas de zoom intempestif lors de la saisie

3. **Impression mobile** :
   - **iOS** : Bouton "Imprimer / PDF" → "Partager" → "Imprimer" ou "Enregistrer en PDF"
   - **Android** : Bouton "Imprimer / PDF" → "Enregistrer en PDF" ou sélectionner une imprimante

4. **Conseils** :
   - Fonctionne en mode portrait et paysage
   - Cliquer en dehors d'un modal pour le fermer
   - Le clavier virtuel ne déclenche plus de zoom automatique

### Améliorations techniques mobiles

#### CSS
- Inputs avec `font-size: 16px` minimum (évite le zoom iOS)
- Propriétés `-webkit-` pour compatibilité Safari/iOS
- `touch-action: manipulation` pour réactivité tactile
- `-webkit-overflow-scrolling: touch` pour scroll fluide
- Zones tactiles ≥ 44px (standard Apple/Google)

#### JavaScript
- Polyfills : `Array.find()`, `Object.values()`, `Object.entries()`
- Détection mobile pour adapter le comportement
- Gestion spécifique impression iOS
- Passive event listeners pour performances
- Prévention dynamique du zoom au focus

#### Meta tags
- Viewport optimisé avec `maximum-scale=5.0`
- Support mode web app iOS
- Désactivation détection auto des numéros de téléphone

### Problèmes connus

**iOS < 9.0**
- Fonctionnalités JavaScript limitées
- Recommandation : Mettre à jour iOS

**Android < 4.4**
- Support CSS moderne limité
- Performance réduite
- Recommandation : Utiliser Chrome récent

**Impression mobile**
- iOS Safari nécessite une étape supplémentaire (Partager > Imprimer)
- Certains navigateurs Android ont des options différentes

## Remarques importantes

- ⚠️ **Pas de sauvegarde automatique** : Les données sont perdues si vous fermez la page. Pensez à imprimer ou exporter en PDF avant de fermer.
- 💡 **Navigateur moderne requis** : Fonctionne avec Chrome, Firefox, Edge, Safari (versions récentes)
- 📱 **Responsive** : Fonctionne sur ordinateur, tablette et mobile (iOS 9+, Android 4.4+)
- 🚀 **Optimisé mobile** : Zoom automatique désactivé, zones tactiles optimisées, performance améliorée

## Support

Pour toute question ou problème, vérifiez que :
- Vous utilisez un navigateur moderne et à jour
- JavaScript est activé dans votre navigateur
- Vous avez une connexion internet (pour charger TailwindCSS et Lucide icons)

## Licence

Libre d'utilisation pour un usage personnel ou professionnel.
