/**
 * Utilitaires pour les calculs de géolocalisation
 */

export const SIGNIFICANT_MOVEMENT_THRESHOLD_METERS = 100;
export const SIGNIFICANT_ENERGY_DELTA_THRESHOLD = 2;

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

/**
 * Calcule la distance (en mètres) entre deux positions GPS via la formule de Haversine
 * @param {Object} position1 Position 1 {lat, lon}
 * @param {Object} position2 Position 2 {lat, lon}
 * @returns {number|null} Distance en mètres, ou null si position invalide
 */
export function calculateDistanceMeters(position1, position2) {
    if (!isValidPosition(position1) || !isValidPosition(position2)) {
        return null;
    }

    const lat1 = toRadians(position1.lat);
    const lat2 = toRadians(position2.lat);
    const deltaLat = toRadians(position2.lat - position1.lat);
    const deltaLon = toRadians(position2.lon - position1.lon);

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
}

/**
 * Détermine si un véhicule a bougé en comparant les positions et les niveaux d'énergie
 * @param {Object} vehicleState1 Premier état du véhicule {position: {lat, lon}, lastEnergyLevel}
 * @param {Object} vehicleState2 Deuxième état du véhicule {position: {lat, lon}, lastEnergyLevel}
 * @returns {Object} Détails de détection {hasMoved, movedByPosition, movedByEnergy, distanceMeters, energyDelta}
 */
export function getVehicleMovementDetails(vehicleState1, vehicleState2) {
    if (!vehicleState1 || !vehicleState2) {
        return {
            hasMoved: true,
            movedByPosition: true,
            movedByEnergy: false,
            distanceMeters: null,
            energyDelta: null,
        };
    }

    const position1 = vehicleState1.position;
    const position2 = vehicleState2.position;
    
    if (!position1 || !position2) {
        return {
            hasMoved: true,
            movedByPosition: true,
            movedByEnergy: false,
            distanceMeters: null,
            energyDelta: null,
        };
    }

    const distanceMeters = calculateDistanceMeters(position1, position2);
    const movedByPosition =
        distanceMeters !== null && distanceMeters >= SIGNIFICANT_MOVEMENT_THRESHOLD_METERS;

    const energy1 = vehicleState1.lastEnergyLevel;
    const energy2 = vehicleState2.lastEnergyLevel;
    const canCompareEnergy =
        typeof energy1 === 'number' && Number.isFinite(energy1) &&
        typeof energy2 === 'number' && Number.isFinite(energy2);
    const energyDelta = canCompareEnergy ? Math.abs(energy2 - energy1) : null;
    const movedByEnergy =
        energyDelta !== null && energyDelta >= SIGNIFICANT_ENERGY_DELTA_THRESHOLD;

    return {
        hasMoved: movedByPosition || movedByEnergy,
        movedByPosition,
        movedByEnergy,
        distanceMeters,
        energyDelta,
    };
}

/**
 * Détermine si un véhicule a bougé selon les seuils de position et d'énergie
 * @param {Object} vehicleState1 Premier état du véhicule {position: {lat, lon}, lastEnergyLevel}
 * @param {Object} vehicleState2 Deuxième état du véhicule {position: {lat, lon}, lastEnergyLevel}
 * @returns {boolean} true si le véhicule est considéré déplacé
 */
export function hasVehicleMoved(vehicleState1, vehicleState2) {
    return getVehicleMovementDetails(vehicleState1, vehicleState2).hasMoved;
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
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat >= -90 && lat <= 90 &&
        lon >= -180 && lon <= 180
    );
}
