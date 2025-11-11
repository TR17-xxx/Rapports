// FICHIER TEMPLATE - À COPIER EN vehicles-data.js
// Copiez ce fichier en vehicles-data.js et remplissez avec vos données réelles.
// Le fichier vehicles-data.js est ignoré par Git afin de protéger les plaques et descriptions.

// Liste des véhicules disponibles pour les conducteurs
// Chaque entrée doit posséder un identifiant unique (id) et/ou une plaque.
const defaultVehicles = [
    {
        id: "hfjsjgf",
        plate: "fjgjgffjg",
        description: "Expert",
        label: "jfgfjgfgj - Expert"
    },
   
];

// Export pour Node.js (serveur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { defaultVehicles };
}

