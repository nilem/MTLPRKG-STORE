import { hasVehicleMoved, isValidPosition } from '../utils/geoUtils.js';

describe('geoUtils', () => {
    describe('hasVehicleMoved', () => {
        const basePosition = { lat: 45.5017, lon: -73.5673 };

        test('détecte qu\'un véhicule a bougé quand la latitude change', () => {
            const newPosition = { lat: 45.5018, lon: -73.5673 };
            const hasMoved = hasVehicleMoved(basePosition, newPosition);
            
            expect(hasMoved).toBe(true);
        });

        test('détecte qu\'un véhicule a bougé quand la longitude change', () => {
            const newPosition = { lat: 45.5017, lon: -73.5674 };
            const hasMoved = hasVehicleMoved(basePosition, newPosition);
            
            expect(hasMoved).toBe(true);
        });

        test('détecte qu\'un véhicule a bougé quand les deux coordonnées changent', () => {
            const newPosition = { lat: 45.5018, lon: -73.5674 };
            const hasMoved = hasVehicleMoved(basePosition, newPosition);
            
            expect(hasMoved).toBe(true);
        });

        test('détecte qu\'un véhicule n\'a pas bougé si les coordonnées sont identiques', () => {
            const newPosition = { lat: 45.5017, lon: -73.5673 };
            const hasMoved = hasVehicleMoved(basePosition, newPosition);
            
            expect(hasMoved).toBe(false);
        });

        test('retourne true si une des positions est manquante', () => {
            expect(hasVehicleMoved(null, basePosition)).toBe(true);
            expect(hasVehicleMoved(basePosition, null)).toBe(true);
            expect(hasVehicleMoved(null, null)).toBe(true);
        });

        test('gère les positions undefined', () => {
            expect(hasVehicleMoved(undefined, basePosition)).toBe(true);
            expect(hasVehicleMoved(basePosition, undefined)).toBe(true);
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
