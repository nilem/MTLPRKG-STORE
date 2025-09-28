/**
 * Utilitaires pour les calculs de géolocalisation
 */

/**
 * Détermine si un véhicule a bougé en comparant les positions
 * @param {Object} position1 Première position {lat, lon}
 * @param {Object} position2 Deuxième position {lat, lon}
 * @returns {boolean} true si le véhicule a bougé
 */
export function hasVehicleMoved(position1, position2) {
    if (!position1 || !position2) {
        return true; // Considérer comme déplacé si on n'a pas les deux positions
    }

    // Comparer seulement les 4 premiers chiffres après la virgule pour déterminer un mouvement significatif
    const lat1Truncated = Math.trunc(position1.lat * 10000) / 10000;
    const lon1Truncated = Math.trunc(position1.lon * 10000) / 10000;
    const lat2Truncated = Math.trunc(position2.lat * 10000) / 10000;
    const lon2Truncated = Math.trunc(position2.lon * 10000) / 10000;

    return lat1Truncated !== lat2Truncated || lon1Truncated !== lon2Truncated;
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
