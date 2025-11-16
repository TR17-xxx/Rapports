# Application de Rapports Hebdomadaires de Chantier

Application web permettant de saisir, contrôler et exporter les rapports hebdomadaires des ouvriers de chantier (heures, chantiers, paniers, PDF, envoi par email).

---

## Objectif du projet

- **Centraliser** les rapports de la semaine pour chaque ouvrier.
- **Automatiser** les calculs (totaux par ouvrier et par chantier).
- **Générer** un PDF prêt à être envoyé au bureau.
- **Faciliter** l’envoi par email aux destinataires concernés.

Ce dépôt ne doit contenir **aucune donnée sensible** (mots de passe, tokens, fichiers `.env`, listes réelles d’ouvriers ou de chantiers, etc.).

---

## Fonctionnalités principales

- **Saisie des heures** du lundi au vendredi.
- **Plusieurs chantiers** possibles par ouvrier sur la même semaine.
- **Gestion du conducteur** de la semaine.
- **Gestion du panier** (standard, grand déplacement, personnalisation par jour).
- **Calcul automatique** des totaux (par ouvrier, par chantier).
- **Impression / export PDF** du rapport.
- **Envoi par email** du rapport (via un petit serveur Node.js).

---

## Pré-requis

- Navigateur moderne (Chrome, Firefox, Edge, Safari).
- Pour l’envoi d’emails :
  - Node.js installé (version récente LTS).
  - Un compte email ou un service SMTP (Gmail, fournisseur pro, service d’emailing…).

---

## Installation

### 1. Cloner le projet

```bash
git clone VOTRE_URL_DU_DEPOT.git
cd Rapport
```

### 2. Mode simple (sans serveur, sans email)

Dans ce mode, il suffit d’ouvrir `index.html` :

1. Ouvrir le dossier du projet.
2. Double-cliquer sur `index.html` ou l’ouvrir avec votre navigateur.

Ce mode permet :

- La saisie des heures.
- Les calculs automatiques.
- L’impression / export PDF depuis le navigateur.

### 3. Mode complet (avec serveur et envoi d’emails)

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Créer un fichier `.env` à partir de l’exemple :

   ```bash
   cp .env.example .env
   ```

3. Éditer `.env` et renseigner **vos** paramètres (SMTP, destinataires, port…) avec des **valeurs privées**. Ne pas utiliser de mots de passe ou tokens présents dans la doc.

4. Démarrer le serveur :

   ```bash
   npm start
   ```

5. Ouvrir l’application via :

   ```text
   http://localhost:3000/index.html
   ```

---

## Utilisation (vue générale)

### 1. Paramétrage de la semaine

- **Sélectionner la semaine** via le sélecteur en haut de l’écran.
- **Choisir le conducteur** de la semaine.
- **Ajouter les ouvriers** nécessaires.

### 2. Saisie des heures et des chantiers

Pour chaque ouvrier :

- Renseigner le ou les chantiers.
- Adapter les heures par jour si nécessaire.
- Gérer le **panier** (standard, grand déplacement ou valeurs personnalisées par jour).
- Vérifier les **totaux automatiques**.

### 3. Export / impression

- Cliquer sur le bouton dédié à l’**impression / PDF**.
- Dans la boîte de dialogue du navigateur, choisir "Imprimer" ou "Enregistrer en PDF".

### 4. Envoi par email

- Configurer les variables d’environnement liées à l’email dans `.env` (voir `.env.example`).
- Démarrer le serveur (`npm start`).
- Utiliser le bouton d’envoi par email dans l’interface.

Les paramètres exacts (adresse d’expéditeur, destinataires, serveur SMTP…) sont **propres à votre organisation** et ne doivent jamais être commit dans le dépôt.

---

## Personnalisation des données

### Ouvriers et chantiers

- Les données réelles (noms, chantiers) doivent être stockées dans un fichier **non versionné**, par exemple `workers-data.js`, ignoré par Git.
- Un fichier modèle (par exemple `workers-data.template.js`) peut fournir une structure avec des **noms fictifs**.

Principe recommandé :

- Commiter uniquement le **template** avec des exemples génériques.
- Ajouter le fichier réel (`workers-data.js`) dans `.gitignore` pour éviter toute fuite de données personnelles.

### Paramètres métiers

- Heures par défaut, règles de calcul, libellés… peuvent être adaptés dans les fichiers JavaScript de l’application (`app.js`, etc.).

---

## Sécurité et bonnes pratiques

- **Ne jamais commiter** :
  - Fichiers `.env`.
  - Mots de passe, tokens, clés API.
  - Données personnelles réelles (noms d’ouvriers, chantiers sensibles…).

- Utiliser toujours :
  - Un fichier `.env.example` avec des **valeurs factices**.
  - Un `.gitignore` qui exclut `.env`, fichiers de données réelles, etc.

- Si vous devez protéger l’accès à la page (paramètre `token` dans l’URL, etc.) :
  - Conservez la **valeur réelle** du token dans vos variables d’environnement ou votre configuration interne.
  - Ne mettez dans le code et dans le README que des **placeholders** du type `VOTRE_TOKEN_ICI`.

En cas de doute, considérez que **tout ce qui est dans ce dépôt est public** et ne doit contenir aucune information sensible.

---

## Dépannage rapide

- La page ne se charge pas correctement :
  - Vérifier que votre navigateur est à jour.
  - Vérifier que JavaScript est activé.

- L’envoi d’email ne fonctionne pas :
  - Vérifier la configuration de `.env` (sans la partager publiquement).
  - Vérifier les logs du serveur Node.js.
  - Tester les identifiants SMTP en dehors de l’application si nécessaire.

---

## Licence

Ce projet peut être utilisé et adapté pour un usage personnel ou professionnel. Vérifiez les conditions internes de votre entreprise avant une utilisation en production.

