/**
 * Utilitaires pour les calculs de géolocalisation
 */

/**
 * Détermine si un véhicule a bougé en comparant les positions et les niveaux d'énergie
 * @param {Object} vehicleState1 Premier état du véhicule {position: {lat, lon}, lastEnergyLevel}
 * @param {Object} vehicleState2 Deuxième état du véhicule {position: {lat, lon}, lastEnergyLevel}
 * @returns {boolean} true si le véhicule a bougé ou si l'énergie a changé
 */
export function hasVehicleMoved(vehicleState1, vehicleState2) {
    if (!vehicleState1 || !vehicleState2) {
        return true; // Considérer comme déplacé si on n'a pas les deux états
    }

    const position1 = vehicleState1.position;
    const position2 = vehicleState2.position;
    
    if (!position1 || !position2) {
        return true;
    }

    // Comparer seulement les 4 premiers chiffres après la virgule pour déterminer un mouvement significatif
    const lat1Truncated = Math.trunc(position1.lat * 10000) / 10000;
    const lon1Truncated = Math.trunc(position1.lon * 10000) / 10000;
    const lat2Truncated = Math.trunc(position2.lat * 10000) / 10000;
    const lon2Truncated = Math.trunc(position2.lon * 10000) / 10000;

    const positionChanged = lat1Truncated !== lat2Truncated || lon1Truncated !== lon2Truncated;

    // Vérifier si le niveau d'énergie a changé
    const energy1 = vehicleState1.lastEnergyLevel;
    const energy2 = vehicleState2.lastEnergyLevel;
    const energyChanged = (energy1 !== undefined && energy2 !== undefined) && energy1 !== energy2;

    return positionChanged || energyChanged;
}

/**
 * Valide qu'une position est correcte
 * @param {Object} position Position à valider {lat, lon}
 * @returns {boolean} true si la position est valide
 */
export function isValidPosition(position) {
    if (!position || typeof position !== 'object') {
        return false;
    }

    const { lat, lon } = position;
    
    return (
        typeof lat === 'number' && 
        typeof lon === 'number' &&
        lat >= -90 && lat <= 90 &&
        lon >= -180 && lon <= 180
    );
}
