// FICHIER TEMPLATE - À COPIER EN vehicles-data.js
// Copiez ce fichier en vehicles-data.js et remplissez avec vos données réelles.
// Le fichier vehicles-data.js est ignoré par Git afin de protéger les plaques et descriptions.

// Liste des véhicules disponibles pour les conducteurs
// Chaque entrée doit posséder un identifiant unique (id) et/ou une plaque.
const defaultVehicles = [
    {
        id: "gw-445-cw",
        plate: "GW-445-CW",
        description: "Expert",
        label: "GW-445-CW - Expert"
    },
    {
        id: "fn-913-cf",
        plate: "FN-913-CF",
        description: "Benne 3 places",
        label: "FN-913-CF - Benne 3 places"
    },
    {
        id: "gp-998-rk",
        plate: "GP-998-RK",
        description: "Benne 3 places",
        label: "GP-998-RK - Benne 3 places"
    },
    {
        id: "fk-690-cr",
        plate: "FK-690-CR",
        description: "Traffic 6 places",
        label: "FK-690-CR - Traffic 6 places"
    },
    {
        id: "gh-038-cm",
        plate: "GH-038-CM",
        description: "Traffic 3 places",
        label: "GH-038-CM - Traffic 3 places"
    },
    {
        id: "fz-387-qg",
        plate: "FZ-387-QG",
        description: "Benne 3 places",
        label: "FZ-387-QG - Benne 3 places"
    },
    {
        id: "dx-322-fe",
        plate: "DX-322-FE",
        description: "Benne 7 places",
        label: "DX-322-FE - Benne 7 places"
    },
    {
        id: "fs-159-tt",
        plate: "FS-159-TT",
        description: "Partner",
        label: "FS-159-TT - Partner"
    },
    {
        id: "gy-078-sd",
        plate: "GY-078-SD",
        description: "Benne 3 places",
        label: "GY-078-SD - Benne 3 places"
    }
];

// Export pour Node.js (serveur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { defaultVehicles };
}

