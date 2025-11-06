// Script pour ajouter les exports Node.js à workers-data.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'workers-data.js');

console.log('🔧 Vérification de workers-data.js...\n');

if (!fs.existsSync(filePath)) {
    console.log('❌ Le fichier workers-data.js n\'existe pas.');
    console.log('💡 Copiez workers-data.template.js en workers-data.js d\'abord.\n');
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Vérifier si les exports existent déjà
if (content.includes('module.exports')) {
    console.log('✅ Les exports Node.js sont déjà présents dans workers-data.js');
    console.log('   Aucune modification nécessaire.\n');
    process.exit(0);
}

// Ajouter les exports à la fin du fichier
const exportCode = `
// Export pour Node.js (serveur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { defaultWorkers, defaultSites };
}
`;

content = content.trim() + '\n' + exportCode;

// Sauvegarder le fichier
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Exports Node.js ajoutés avec succès à workers-data.js');
console.log('   Le serveur peut maintenant charger les données.\n');
console.log('💡 Redémarrez le serveur pour appliquer les changements.\n');
