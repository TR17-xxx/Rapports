# Configuration des Données (Ouvriers et Chantiers)

## 📋 Vue d'ensemble

Les données des ouvriers et chantiers sont maintenant gérées de manière simplifiée via le fichier `workers-data.js`, sans besoin de configurer les variables d'environnement Netlify.

## 🔧 Configuration Locale (Développement)

### 1. Créer le fichier workers-data.js

Si ce n'est pas déjà fait, copiez le template :

```bash
cp workers-data.template.js workers-data.js
```

### 2. Modifier workers-data.js

Éditez `workers-data.js` avec vos données réelles :

```javascript
// Liste des ouvriers par défaut
const defaultWorkers = [
    { id: 1, firstName: "Jean", lastName: "Dupont" },
    { id: 2, firstName: "Marie", lastName: "Martin" },
    // Ajoutez vos ouvriers ici...
];

// Liste des chantiers par défaut (par ordre alphabétique)
const defaultSites = [
    "Brouage",
    "Château d'Oléron",
    "La Rochelle",
    // Ajoutez vos chantiers ici...
];

// Export pour Node.js (serveur) - NE PAS MODIFIER
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { defaultWorkers, defaultSites };
}
```

### 3. Démarrer le serveur

```bash
npm start
```

Le serveur chargera automatiquement les données depuis `workers-data.js`.

## 🌐 Déploiement en Production (Netlify)

### Option 1 : Utiliser les variables d'environnement (Recommandé pour la production)

1. Allez dans **Netlify Dashboard** → Votre site → **Site settings** → **Environment variables**

2. Ajoutez les variables suivantes :

   - `WORKERS_DATA` : JSON des ouvriers
     ```json
     [{"id":1,"firstName":"Jean","lastName":"Dupont"},{"id":2,"firstName":"Marie","lastName":"Martin"}]
     ```

   - `SITES_DATA` : JSON des chantiers
     ```json
     ["Brouage","Château d'Oléron","La Rochelle"]
     ```

   - `ACCESS_TOKEN` : Token de sécurité (ex: `rapport2024secure`)

### Option 2 : Inclure workers-data.js dans le déploiement

⚠️ **Attention** : Cette option expose vos données dans le dépôt Git.

1. Retirez `workers-data.js` du `.gitignore`
2. Commitez le fichier
3. Déployez sur Netlify

L'application chargera automatiquement les données depuis le fichier.

## 🔒 Sécurité

- ✅ `workers-data.js` est dans `.gitignore` par défaut
- ✅ Les données ne sont jamais exposées publiquement
- ✅ L'API nécessite un token d'accès (`ACCESS_TOKEN`)
- ✅ Le fichier reste local sur votre machine

## 🔄 Fonctionnement

### En Local
1. L'application charge `workers-data.js` via `<script>` dans `index.html`
2. Si le fichier n'est pas disponible, l'API `/api/workers-data` est appelée
3. Le serveur Node.js lit `workers-data.js` et retourne les données

### En Production (Netlify)
1. L'application essaie de charger `workers-data.js` via `<script>`
2. Si non disponible, l'API `/.netlify/functions/get-workers-data` est appelée
3. La fonction serverless lit les variables d'environnement Netlify

## 📝 Ajouter des Chantiers

Pour ajouter des chantiers, éditez simplement `workers-data.js` :

```javascript
const defaultSites = [
    "Brouage",
    "Château d'Oléron",
    "La Rochelle",
    "Nouveau Chantier 1",  // ← Ajoutez ici
    "Nouveau Chantier 2",  // ← Et ici
];
```

Rechargez la page, les nouveaux chantiers apparaîtront automatiquement !

## ❓ Dépannage

### Les données ne se chargent pas

1. Vérifiez que `workers-data.js` existe
2. Vérifiez que le serveur Node.js est démarré (`npm start`)
3. Vérifiez la console du navigateur pour les erreurs
4. Vérifiez que le token `ACCESS_TOKEN` est correct

### Les modifications ne sont pas prises en compte

1. Rechargez la page (Ctrl+F5 pour forcer le rechargement)
2. Vérifiez que `workers-data.js` est bien modifié
3. Redémarrez le serveur Node.js

## 📚 Structure des Fichiers

```
Rapport/
├── workers-data.js              # Vos données réelles (non versionné)
├── workers-data.template.js     # Template pour créer workers-data.js
├── workers-data-backup.js       # Backup (non versionné)
├── server.js                    # Serveur Node.js avec API /api/workers-data
├── app.js                       # Application frontend
└── index.html                   # Page principale
```
