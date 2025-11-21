# Guide de Maintenance : Méthode des Branches (Remplacement de Fichier)

Ce guide détaille la méthode "classique" pour gérer la maintenance. Elle consiste à remplacer physiquement la page d'accueil sur la branche principale, tout en travaillant sur une branche secondaire qui conserve le site normal.

## Principe
- **Branche `main` (Site Public)** : Le fichier `index.html` est remplacé par le contenu de `maintenance.html`.
- **Branche `mise-a-jour` (Votre Espace de Travail)** : Le fichier `index.html` reste votre application normale.

---

## Étape 1 : Activer la Maintenance (Sur `main`)

Nous allons remplacer la page d'accueil par la page de maintenance uniquement sur la branche principale.

1. **Placez-vous sur la branche principale :**
   ```powershell
   git checkout main
   git pull
   ```

2. **Remplacez l'index par la maintenance :**
   ```powershell
   # Copie le contenu de maintenance.html dans index.html
   Copy-Item maintenance.html -Destination index.html -Force
   ```

3. **Envoyez la maintenance en ligne :**
   ```powershell
   git add index.html
   git commit -m "ACTIVER MAINTENANCE: Site inaccessible pour les visiteurs"
   git push origin main
   ```
   ✅ *Le site affiche maintenant la page de maintenance.*

---

## Étape 2 : Travailler sur vos Mises à Jour

Vous travaillez maintenant sur une branche séparée où le site fonctionne normalement.

1. **Créez votre branche de travail (à partir de main, mais on va restaurer le site) :**
   ```powershell
   git checkout -b mise-a-jour-v2
   ```

2. **Restaurez le site normal sur cette branche :**
   Puisque nous avons copié la maintenance sur `main`, votre nouvelle branche a aussi la maintenance. Il faut remettre le vrai site pour travailler.
   *Si vous aviez déjà une version sauvegardée ou si vous devez annuler le changement précédent sur cette branche uniquement :*
   ```powershell
   # Option A : Si vous avez déjà commité le vrai site avant la maintenance
   git checkout HEAD~1 -- index.html
   
   # Option B : Si vous avez le vrai code ailleurs, remettez-le dans index.html
   ```
   *(Une fois que `index.html` contient votre application normale sur cette branche, vous pouvez travailler).*

3. **Développez et Testez :**
   Faites vos modifications, sauvegardez et testez localement.

---

## Étape 3 : Retour à la Normale (Fin de Maintenance)

Une fois votre travail terminé sur la branche `mise-a-jour-v2`.

1. **Retournez sur `main` :**
   ```powershell
   git checkout main
   ```

2. **Fusionnez votre travail :**
   ```powershell
   git merge mise-a-jour-v2
   ```

3. **⚠️ GESTION DU CONFLIT (Crucial)** :
   Git va voir un conflit sur `index.html` (Version Maintenance vs Version App).
   Il faut **imposer** la version de votre branche de travail (l'App).

   ```powershell
   # Cette commande dit : "Prends le fichier index.html tel qu'il est dans mise-a-jour-v2"
   git checkout mise-a-jour-v2 -- index.html
   ```

4. **Validez et Déployez :**
   ```powershell
   git add index.html
   git commit -m "FIN MAINTENANCE: Déploiement de la nouvelle version"
   git push origin main
   ```

✅ *Le site est à jour et la page de maintenance a disparu.*
