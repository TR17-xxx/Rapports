# Modifications du PDF - Alignement avec la feuille d'impression

## Date
2 novembre 2025

## Objectif
Faire en sorte que le PDF généré corresponde exactement à la feuille d'impression HTML.

## Fichiers modifiés

### 1. `netlify/functions/send-report.js`

#### Modifications de l'en-tête
- **Titre** : "RAPPORT HEBDOMADAIRE" → "FICHE DE POINTAGE HEBDOMADAIRE"
- **Label nom** : "Nom" → "NOM:"
- Ajustement des tailles de police (12pt pour le titre, 9pt pour les labels)
- Mise en gras du numéro de semaine et du nom de l'ouvrier

#### Modifications du tableau
- **Ajout de la colonne SAMEDI** : 8 colonnes au lieu de 7 (CHANTIER, LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI, TOTAL)
- **Cellules vides** : Affichage de cellules vides au lieu de "0" quand il n'y a pas d'heures
- **Lignes vides** : Minimum 5 lignes de chantiers pour uniformiser le tableau
- **Ligne Total** : Positionnée dans la colonne SAMEDI avec le total en rouge dans la dernière colonne
- **En-têtes** : Fond blanc au lieu de gris, texte en majuscules

#### Ajout des lignes PANIER, TRANSPORT, TRAJET
- **PANIER** : Calculé selon le mode sélectionné (panier/grand_deplacement/personnaliser)
  - Mode "panier" : "1" pour chaque jour travaillé
  - Mode "grand_deplacement" : "GD" pour chaque jour travaillé
  - Mode "personnaliser" : Valeurs personnalisées par jour
- **TRANSPORT** : "1" pour chaque jour où l'ouvrier est conducteur
- **TRAJET** : "1" pour chaque jour travaillé
- Fond gris clair (#f0f0f0) pour ces lignes
- Texte en gras

#### Modifications des observations
- **Mention INTÉRIMAIRE** : Affichée automatiquement si `isInterim !== false`
- **Texte centré** : Les observations sont maintenant centrées et en italique
- **Label** : "Observations :" → "OBSERVATIONS:"

#### Modifications du pied de page
- "Signature de l'ouvrier" → "Référence: Agenda chef d'équipe"
- "Signature du chef de chantier" → "Visa conducteur:"
- Texte en gras

### 2. `app.js`

#### Ajout des données dans `sendReportByEmail`
Pour chaque ouvrier, les données suivantes sont maintenant envoyées au serveur :

```javascript
{
    name: string,
    sites: [...],
    observation: string,
    drivers: {                    // NOUVEAU
        monday: boolean,
        tuesday: boolean,
        wednesday: boolean,
        thursday: boolean,
        friday: boolean
    },
    panierMode: string,          // NOUVEAU (panier/grand_deplacement/personnaliser)
    panierCustom: object,        // NOUVEAU (valeurs personnalisées par jour)
    isInterim: boolean           // NOUVEAU
}
```

## Résultat

Le PDF généré contient maintenant :
- ✅ Le même titre que la feuille d'impression
- ✅ La colonne SAMEDI
- ✅ Les lignes PANIER, TRANSPORT, TRAJET avec calculs automatiques
- ✅ La mention INTÉRIMAIRE si applicable
- ✅ Les observations centrées et en italique
- ✅ Le même pied de page que la feuille d'impression
- ✅ Le même style visuel (fond blanc pour l'en-tête, fond gris pour les lignes spéciales)

## Test recommandé

1. Créer un rapport avec plusieurs ouvriers
2. Définir des conducteurs pour certains jours
3. Configurer différents modes de panier (panier, grand déplacement, personnalisé)
4. Marquer certains ouvriers comme intérimaires
5. Envoyer le rapport par email
6. Vérifier que le PDF reçu correspond exactement à la feuille d'impression

## Notes techniques

- Les calculs PANIER/TRANSPORT/TRAJET sont effectués côté serveur dans la fonction `generatePDF`
- Le mode panier par défaut est "panier" si non spécifié
- La valeur `isInterim` est `true` par défaut (pour compatibilité avec les données existantes)
- Les jours sans heures affichent des cellules vides au lieu de "0"
