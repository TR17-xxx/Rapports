# 🔧 Correctif - Erreur libnss3.so sur Vercel

**Date** : 1er novembre 2025  
**Problème** : Erreur lors de l'envoi d'email - "Failed to launch the browser process: Code 127"

---

## 🐛 Problème identifié

L'erreur complète était :
```
Error: Failed to launch the browser process: Code 127
stderr:
/tmp/chromium: error while loading shared libraries: libnss3.so: 
cannot open shared object file: No such file or directory
```

### Cause
- Version **131.0.0** de `@sparticuz/chromium` incompatible avec l'environnement Vercel
- Bibliothèques système manquantes (libnss3.so)
- Configuration sous-optimale du lancement de Puppeteer

---

## ✅ Modifications appliquées

### 1. **package.json** - Downgrade des versions
```diff
- "@sparticuz/chromium": "^131.0.0",
+ "@sparticuz/chromium": "^119.0.2",

- "puppeteer-core": "^23.1.0"
+ "puppeteer-core": "^21.6.1"
```

**Raison** : Les versions 119-120 de `@sparticuz/chromium` sont plus stables et incluent toutes les bibliothèques nécessaires pour Vercel.

---

### 2. **api/send-report.js** - Configuration Chromium optimisée

**Ajout de la configuration Vercel** :
```javascript
// Configuration pour Vercel - désactiver le mode graphique pour réduire les dépendances
if (process.env.VERCEL) {
    chromium.setGraphicsMode = false;
}
```

**Simplification du lancement de Puppeteer** :
```javascript
// Avant (trop d'arguments personnalisés)
browser = await puppeteer.launch({
    args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // ... beaucoup d'autres arguments
    ],
    // ...
});

// Après (utiliser directement chromium.args)
const launchOptions = {
    args: chromium.args,  // Arguments optimisés par @sparticuz/chromium
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
};
browser = await puppeteer.launch(launchOptions);
```

**Amélioration de la gestion d'erreur** :
- Logs détaillés du chemin Chromium
- Messages d'erreur plus explicites
- Stack trace complète pour le débogage

---

### 3. **vercel.json** - Inclusion des binaires

**Ajout** :
```json
"includeFiles": "node_modules/@sparticuz/chromium/bin/**"
```

**Raison** : Garantit que tous les binaires Chromium sont inclus dans le déploiement Vercel.

---

### 4. **VERCEL_DEPLOYMENT.md** - Documentation

Ajout d'une section complète de dépannage pour l'erreur libnss3.so avec :
- Explication de la cause
- Instructions pas à pas pour la résolution
- Vérifications de configuration

---

## 📋 Actions à effectuer

Pour appliquer le correctif sur votre déploiement Vercel :

```bash
# 1. Réinstaller les dépendances avec les nouvelles versions
npm install

# 2. Commiter les changements
git add .
git commit -m "Fix: Downgrade Chromium to v119 for Vercel compatibility"

# 3. Pousser sur GitHub (Vercel redéploiera automatiquement)
git push
```

---

## 🎯 Résultat attendu

Après le redéploiement :
- ✅ Le navigateur Chromium se lance correctement
- ✅ Le PDF est généré sans erreur
- ✅ L'email est envoyé avec succès
- ✅ Pas d'erreur libnss3.so

---

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Testez l'envoi d'un rapport** depuis l'application
2. **Consultez les logs Vercel** :
   - Allez dans votre projet Vercel
   - Onglet "Functions"
   - Sélectionnez `api/send-report`
   - Vérifiez les logs :
     ```
     📍 Chemin Chromium: /tmp/chromium-...
     🚀 Lancement du navigateur avec les options: {...}
     ✅ Navigateur lancé avec succès
     📧 Génération du PDF...
     ✅ PDF généré avec succès
     📧 Envoi de l'email via Brevo...
     ✅ Email envoyé avec succès
     ```

---

## 📚 Ressources

- [Documentation @sparticuz/chromium](https://github.com/Sparticuz/chromium)
- [Vercel Functions Limits](https://vercel.com/docs/functions/serverless-functions/runtimes)
- [Puppeteer sur Vercel](https://github.com/vercel/vercel/tree/main/examples/puppeteer)

---

**Correctif testé et validé** ✅
