const DEFAULT_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
        const rawData = process.env.VEHICLES_DATA || '[]';
        let vehicles = [];
        
        try {
            vehicles = JSON.parse(rawData);
        } catch (parseError) {
            console.error('Impossible de parser VEHICLES_DATA:', parseError);
            vehicles = [];
        }
        
        if (!Array.isArray(vehicles)) {
            vehicles = [];
        }
        
        return {
            statusCode: 200,
            headers: {
                ...DEFAULT_HEADERS,
                'Content-Type': 'application/json'
            },
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
