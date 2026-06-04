import {
    calculateDistanceMeters,
    getVehicleMovementDetails,
    hasVehicleMoved,
    isValidPosition,
    SIGNIFICANT_ENERGY_DELTA_THRESHOLD,
    SIGNIFICANT_MOVEMENT_THRESHOLD_METERS,
} from '../utils/geoUtils.js';

describe('geoUtils', () => {
    describe('hasVehicleMoved', () => {
        const baseState = { 
            position: { lat: 45.5017, lon: -73.5673 }, 
            lastEnergyLevel: 85 
        };

        test('détecte un mouvement réel si distance >= 100 mètres', () => {
            const newState = { 
                position: { lat: 45.5027, lon: -73.5673 },
                lastEnergyLevel: 85,
            };

            const distance = calculateDistanceMeters(baseState.position, newState.position);
            expect(distance).toBeGreaterThanOrEqual(SIGNIFICANT_MOVEMENT_THRESHOLD_METERS);

            const hasMoved = hasVehicleMoved(baseState, newState);
            expect(hasMoved).toBe(true);
        });

        test('ignore un déplacement GPS mineur si distance < 100 mètres et énergie < seuil', () => {
            const newState = { 
                position: { lat: 45.5025, lon: -73.5673 },
                lastEnergyLevel: 86,
            };

            const distance = calculateDistanceMeters(baseState.position, newState.position);
            expect(distance).toBeLessThan(SIGNIFICANT_MOVEMENT_THRESHOLD_METERS);

            const hasMoved = hasVehicleMoved(baseState, newState);
            expect(hasMoved).toBe(false);
        });

        test('détecte un mouvement si delta énergie >= seuil même sans déplacement', () => {
            const newState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: 83,
            };

            expect(Math.abs(newState.lastEnergyLevel - baseState.lastEnergyLevel))
                .toBeGreaterThanOrEqual(SIGNIFICANT_ENERGY_DELTA_THRESHOLD);

            const hasMoved = hasVehicleMoved(baseState, newState);
            expect(hasMoved).toBe(true);
        });

        test('ignore les changements d\'énergie si delta < seuil', () => {
            const almostSameEnergyState = {
                position: { lat: 45.5017, lon: -73.5673 },
                lastEnergyLevel: 84,
            };

            expect(hasVehicleMoved(baseState, almostSameEnergyState)).toBe(false);
        });

        test('ignore le jitter GPS de quelques mètres', () => {
            const jitteredState = {
                position: { lat: 45.50173, lon: -73.56727 },
                lastEnergyLevel: 85,
            };

            const distance = calculateDistanceMeters(baseState.position, jitteredState.position);
            expect(distance).toBeLessThan(10);
            expect(hasVehicleMoved(baseState, jitteredState)).toBe(false);
        });

        test('retourne true si un état ou une position est manquant', () => {
            const stateWithoutPosition = { lastEnergyLevel: 85 };

            expect(hasVehicleMoved(null, baseState)).toBe(true);
            expect(hasVehicleMoved(baseState, null)).toBe(true);
            expect(hasVehicleMoved(stateWithoutPosition, baseState)).toBe(true);
            expect(hasVehicleMoved(baseState, stateWithoutPosition)).toBe(true);
        });

        test('retourne les détails du trigger basé sur la position', () => {
            const movedState = {
                position: { lat: 45.5027, lon: -73.5673 },
                lastEnergyLevel: 85,
            };

            const result = getVehicleMovementDetails(baseState, movedState);

            expect(result.hasMoved).toBe(true);
            expect(result.movedByPosition).toBe(true);
            expect(result.movedByEnergy).toBe(false);
            expect(result.distanceMeters).toBeGreaterThanOrEqual(SIGNIFICANT_MOVEMENT_THRESHOLD_METERS);
            expect(result.energyDelta).toBe(0);
        });

        test('retourne les détails du trigger basé sur l\'énergie', () => {
            const energyTriggerState = {
                position: { lat: 45.5017, lon: -73.5673 },
                lastEnergyLevel: 82,
            };

            const result = getVehicleMovementDetails(baseState, energyTriggerState);

            expect(result.hasMoved).toBe(true);
            expect(result.movedByPosition).toBe(false);
            expect(result.movedByEnergy).toBe(true);
            expect(result.distanceMeters).toBe(0);
            expect(result.energyDelta).toBe(3);
        });
    });

    describe('calculateDistanceMeters', () => {
        test('retourne environ 111.2 km pour 1 degré de latitude', () => {
            const distance = calculateDistanceMeters(
                { lat: 0, lon: 0 },
                { lat: 1, lon: 0 }
            );

            expect(distance).toBeGreaterThan(111000);
            expect(distance).toBeLessThan(111300);
        });

        test('retourne null si une position est invalide', () => {
            const distance = calculateDistanceMeters(
                { lat: 0, lon: 0 },
                { lat: 95, lon: 0 }
            );

            expect(distance).toBeNull();
        });
    });

    describe('isValidPosition', () => {
        test('valide une position correcte', () => {
            const validPosition = { lat: 45.5017, lon: -73.5673 };
            expect(isValidPosition(validPosition)).toBe(true);
        });

        test('rejette une position avec des coordonnées invalides', () => {
            expect(isValidPosition({ lat: 91, lon: -73.5673 })).toBe(false); // Latitude trop grande
            expect(isValidPosition({ lat: -91, lon: -73.5673 })).toBe(false); // Latitude trop petite
            expect(isValidPosition({ lat: 45.5017, lon: 181 })).toBe(false); // Longitude trop grande
            expect(isValidPosition({ lat: 45.5017, lon: -181 })).toBe(false); // Longitude trop petite
        });

        test('rejette une position avec des types invalides', () => {
            expect(isValidPosition({ lat: '45.5017', lon: -73.5673 })).toBe(false); // String au lieu de number
            expect(isValidPosition({ lat: 45.5017, lon: 'invalid' })).toBe(false); // String invalide
            expect(isValidPosition({ lat: NaN, lon: -73.5673 })).toBe(false); // NaN
        });

        test('rejette une position null ou undefined', () => {
            expect(isValidPosition(null)).toBe(false);
            expect(isValidPosition(undefined)).toBe(false);
            expect(isValidPosition({})).toBe(false);
        });

        test('rejette une position avec des propriétés manquantes', () => {
            expect(isValidPosition({ lat: 45.5017 })).toBe(false); // Longitude manquante
            expect(isValidPosition({ lon: -73.5673 })).toBe(false); // Latitude manquante
        });
    });
});
