import axios from 'axios';

const config = {
    identityBaseUrl: 'https://aima-us.vulog.net/auth/realms/LEO-CAMTR/protocol/openid-connect/token',
    anonymousClientId: 'LEO-CAMTR_anon',
    anonymousClientSecret: '8600ffa0-2304-46fb-8017-d5da7d0fa4f9',
    anonymousBaseUrl: 'https://aima-us.vulog.net/apiv5',
    anonymousApiKey: '18aed9af-ba0f-41de-b4b8-a65aa7fe9c14',
    userAgent: 'MonApp/1.0',
    montrealCityId: '81580773-9478-4d76-86c1-3128d13538cf', // From /cities[0].id
};

/**
 * Récupère un nouveau jeton d'accès depuis le service d'identité.
 * @returns {Promise<string>} Le jeton d'accès formaté pour l'en-tête d'autorisation.
 */
async function fetchNewToken() {
    const params = new URLSearchParams();
    params.append('scope', '');
    params.append('client_id', config.anonymousClientId);
    params.append('client_secret', config.anonymousClientSecret);
    params.append('grant_type', 'client_credentials');

    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': config.userAgent
        },
        data: params,
        url: config.identityBaseUrl
    };

    try {
        const response = await axios(options);
        const token = response.data;
        console.log("Nouveau jeton obtenu.");
        return `${token.token_type} ${token.access_token}`;
    } catch (error) {
        console.error("Erreur lors de la récupération du jeton :", error.response ? error.response.data : error.message);
        throw error;
    }
}

async function getAvailableVehicules() {
    try {
        // Comme dans l'exemple de index.ts, nous demandons un jeton deux fois.
        await fetchNewToken();
        const tokenString = await fetchNewToken();

        const options = {
            method: 'GET',
            url: `${config.anonymousBaseUrl}/availableVehicles/${config.montrealCityId}`,
            headers: {
                'authorization': tokenString,
                'user-agent': config.userAgent,
                'X-API-Key': config.anonymousApiKey,
                'accept': 'application/json',
                'user-lat': '45.507770',
                'user-lon': '-73.562721',
            }
        };

        const response = await axios(options);
        console.log("Données de '/availableVehicles' récupérées avec succès :");
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération des données de '/availableVehicles' :", error.response ? error.response.data : error.message);
    }
}

export { getAvailableVehicules };
