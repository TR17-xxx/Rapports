// Script pour générer les variables d'environnement Netlify depuis workers-data.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Génération des variables d\'environnement pour Netlify...\n');

const workersDataPath = path.join(__dirname, 'workers-data.js');
const vehiclesDataPath = path.join(__dirname, 'vehicles-data.js');

if (!fs.existsSync(workersDataPath)) {
    console.log('❌ Le fichier workers-data.js n\'existe pas.');
    console.log('💡 Créez d\'abord workers-data.js avec vos données.\n');
    process.exit(1);
}

if (!fs.existsSync(vehiclesDataPath)) {
    console.log('❌ Le fichier vehicles-data.js n\'existe pas.');
    console.log('💡 Copiez d\'abord vehicles-data.template.js en vehicles-data.js puis complétez vos véhicules.\n');
    process.exit(1);
}

// Charger les données
delete require.cache[require.resolve('./workers-data.js')];
const workersData = require('./workers-data.js');

delete require.cache[require.resolve('./vehicles-data.js')];
const vehiclesData = require('./vehicles-data.js');

if (!workersData.defaultWorkers || !workersData.defaultSites) {
    console.log('❌ workers-data.js ne contient pas defaultWorkers ou defaultSites.');
    process.exit(1);
}

if (!vehiclesData.defaultVehicles || !Array.isArray(vehiclesData.defaultVehicles)) {
    console.log('❌ vehicles-data.js ne contient pas defaultVehicles (tableau).');
    process.exit(1);
}

// Générer le JSON pour les variables d'environnement
const workersJson = JSON.stringify(workersData.defaultWorkers);
const sitesJson = JSON.stringify(workersData.defaultSites);
const vehiclesJson = JSON.stringify(vehiclesData.defaultVehicles);

console.log('✅ Variables d\'environnement générées avec succès!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 INSTRUCTIONS POUR NETLIFY:\n');
console.log('1. Allez sur: https://app.netlify.com/');
console.log('2. Sélectionnez votre site');
console.log('3. Allez dans: Site settings → Environment variables');
console.log('4. Ajoutez ou mettez à jour ces variables:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📊 Variable: WORKERS_DATA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(workersJson);
console.log('\n');

console.log('🏗️  Variable: SITES_DATA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(sitesJson);
console.log('\n');

console.log('🚚 Variable: VEHICLES_DATA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(vehiclesJson);
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Sauvegarder dans un fichier pour référence
const outputPath = path.join(__dirname, 'netlify-env-variables.txt');
const output = `NETLIFY ENVIRONMENT VARIABLES
Generated on: ${new Date().toLocaleString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variable Name: WORKERS_DATA
Value:
${workersJson}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variable Name: SITES_DATA
Value:
${sitesJson}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variable Name: VEHICLES_DATA
Value:
${vehiclesJson}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variable Name: ACCESS_TOKEN
Value:
rapport2024secure

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUCTIONS:
1. Allez sur https://app.netlify.com/
2. Sélectionnez votre site
3. Allez dans: Site settings → Environment variables
4. Ajoutez ou mettez à jour ces 3 variables
5. Redéployez le site (automatique après modification des variables)

STATISTIQUES:
- ${workersData.defaultWorkers.length} ouvriers
- ${workersData.defaultSites.length} chantiers
`;

fs.writeFileSync(outputPath, output, 'utf8');

console.log(`💾 Les variables ont été sauvegardées dans: netlify-env-variables.txt`);
console.log(`📊 Statistiques:`);
console.log(`   - ${workersData.defaultWorkers.length} ouvriers`);
console.log(`   - ${workersData.defaultSites.length} chantiers`);
console.log(`   - ${vehiclesData.defaultVehicles.length} véhicules\n`);
console.log('🚀 Après avoir mis à jour les variables sur Netlify, le site se redéploiera automatiquement.\n');
