// Fonction serverless pour récupérer les données des ouvriers et chantiers
exports.handler = async (event, context) => {
    // Vérifier le token d'accès
    const token = event.headers['x-access-token'] || event.queryStringParameters?.token;
    
    if (token !== process.env.ACCESS_TOKEN) {
        return {
            statusCode: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }
    
    // Récupérer les données depuis les variables d'environnement
    const workersData = process.env.WORKERS_DATA;
    const sitesData = process.env.SITES_DATA;
    
    if (!workersData || !sitesData) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Data not configured' })
        };
    }
    
    try {
        const workers = JSON.parse(workersData);
        const sites = JSON.parse(sitesData);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'private, max-age=300'
            },
            body: JSON.stringify({
                workers: workers,
                sites: sites
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Invalid data format' })
        };
    }
};