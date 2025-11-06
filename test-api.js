// Script de test pour vérifier que l'API workers-data fonctionne
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/workers-data',
    method: 'GET',
    headers: {
        'X-Access-Token': 'rapport2024secure'
    }
};

console.log('🧪 Test de l\'API /api/workers-data...\n');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📦 Headers:`, res.headers);
        console.log(`\n📄 Response:\n`);
        
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
            
            if (json.success) {
                console.log(`\n✅ API fonctionne correctement !`);
                console.log(`   - ${json.workers.length} ouvriers chargés`);
                console.log(`   - ${json.sites.length} chantiers chargés`);
            } else {
                console.log(`\n❌ Erreur: ${json.message}`);
            }
        } catch (e) {
            console.log(data);
            console.log(`\n❌ Erreur de parsing JSON:`, e.message);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Erreur de requête:', error.message);
    console.log('\n💡 Assurez-vous que le serveur est démarré avec: npm start');
});

req.end();
