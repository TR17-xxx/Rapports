# Application de Rapports Hebdomadaires de Chantier

Application web simple pour gérer les rapports hebdomadaires des ouvriers de chantier.

## Fonctionnalités

- ✅ Saisie des heures du lundi au vendredi
- ✅ Heures pré-remplies à 7.5h par jour
- ✅ Gestion de plusieurs chantiers par ouvrier
- ✅ Désignation du conducteur de la semaine
- ✅ Calcul automatique des totaux par ouvrier
- ✅ Calcul automatique des totaux par chantier
- ✅ Impression / Export PDF
- ✅ Ajout dynamique d'ouvriers

## Installation

Aucune installation nécessaire ! Il suffit d'ouvrir le fichier `index.html` dans un navigateur web moderne (Chrome, Firefox, Edge, Safari).

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
4. Les totaux se calculent automatiquement

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

1. **Imprimer** : Cliquez sur le bouton "Imprimer / PDF" en haut à droite
2. **Enregistrer en PDF** : Dans la fenêtre d'impression, choisissez "Enregistrer au format PDF"
3. Le rapport inclut :
   - La période de la semaine
   - Le conducteur désigné
   - Le détail par ouvrier et chantier
   - Les tableaux récapitulatifs

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

## Remarques importantes

- ⚠️ **Pas de sauvegarde automatique** : Les données sont perdues si vous fermez la page. Pensez à imprimer ou exporter en PDF avant de fermer.
- 💡 **Navigateur moderne requis** : Fonctionne avec Chrome, Firefox, Edge, Safari (versions récentes)
- 📱 **Responsive** : Fonctionne sur ordinateur, tablette et mobile

## Support

Pour toute question ou problème, vérifiez que :
- Vous utilisez un navigateur moderne et à jour
- JavaScript est activé dans votre navigateur
- Vous avez une connexion internet (pour charger TailwindCSS et Lucide icons)

## Licence

Libre d'utilisation pour un usage personnel ou professionnel.
