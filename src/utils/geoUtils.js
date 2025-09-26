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

    return position1.lat !== position2.lat || position1.lon !== position2.lon;
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
