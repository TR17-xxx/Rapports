const DEFAULT_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: DEFAULT_HEADERS,
            body: ''
        };
    }
    
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }
    
    try {
        const rawData = process.env.VEHICLES_DATA;

        if (!rawData) {
            console.warn('⚠️  La variable d\'environnement VEHICLES_DATA est absente ou vide.');
            return {
                statusCode: 500,
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({
                    message: 'VEHICLES_DATA non configurée',
                    vehicles: []
                })
            };
        }

        let vehicles = [];
        
        try {
            vehicles = JSON.parse(rawData);
        } catch (parseError) {
            console.error('Impossible de parser VEHICLES_DATA:', parseError);
            return {
                statusCode: 500,
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({
                    message: 'Format invalide pour VEHICLES_DATA',
                    vehicles: []
                })
            };
        }
        
        if (!Array.isArray(vehicles)) {
            console.error('VEHICLES_DATA n\'est pas un tableau.');
            return {
                statusCode: 500,
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({
                    message: 'VEHICLES_DATA doit être un tableau JSON',
                    vehicles: []
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({
                vehicles
            })
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des véhicules:', error);
        return {
            statusCode: 500,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ message: 'Erreur interne du serveur' })
        };
    }
};
