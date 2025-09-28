import { hasVehicleMoved, isValidPosition } from '../utils/geoUtils.js';

describe('geoUtils', () => {
    describe('hasVehicleMoved', () => {
        const baseState = { 
            position: { lat: 45.5017, lon: -73.5673 }, 
            lastEnergyLevel: undefined 
        };

        test('détecte qu\'un véhicule a bougé quand la latitude change', () => {
            const newState = { 
                position: { lat: 45.5018, lon: -73.5673 }, 
                lastEnergyLevel: undefined 
            };
            const hasMoved = hasVehicleMoved(baseState, newState);
            
            expect(hasMoved).toBe(true);
        });

        test('détecte qu\'un véhicule a bougé quand la longitude change', () => {
            const newState = { 
                position: { lat: 45.5017, lon: -73.5674 }, 
                lastEnergyLevel: undefined 
            };
            const hasMoved = hasVehicleMoved(baseState, newState);
            
            expect(hasMoved).toBe(true);
        });

        test('détecte qu\'un véhicule a bougé quand les deux coordonnées changent', () => {
            const newState = { 
                position: { lat: 45.5018, lon: -73.5674 }, 
                lastEnergyLevel: undefined 
            };
            const hasMoved = hasVehicleMoved(baseState, newState);
            
            expect(hasMoved).toBe(true);
        });

        test('détecte qu\'un véhicule n\'a pas bougé si les coordonnées sont identiques', () => {
            const newState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: undefined 
            };
            const hasMoved = hasVehicleMoved(baseState, newState);
            
            expect(hasMoved).toBe(false);
        });

        test('retourne true si une des positions est manquante', () => {
            const stateWithoutPosition = { lastEnergyLevel: undefined };
            
            expect(hasVehicleMoved(null, baseState)).toBe(true);
            expect(hasVehicleMoved(baseState, null)).toBe(true);
            expect(hasVehicleMoved(null, null)).toBe(true);
            expect(hasVehicleMoved(stateWithoutPosition, baseState)).toBe(true);
            expect(hasVehicleMoved(baseState, stateWithoutPosition)).toBe(true);
        });

        test('gère les états undefined', () => {
            expect(hasVehicleMoved(undefined, baseState)).toBe(true);
            expect(hasVehicleMoved(baseState, undefined)).toBe(true);
        });

        test('ignore les micro-mouvements (précision limitée à 4 chiffres)', () => {
            const baseState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: undefined 
            };
            
            // Micro-mouvements qui devraient être ignorés (changements au 5e chiffre et plus)
            const microMovement1 = { 
                position: { lat: 45.50170001, lon: -73.5673 }, 
                lastEnergyLevel: undefined 
            };
            const microMovement2 = { 
                position: { lat: 45.5017, lon: -73.56730009 }, 
                lastEnergyLevel: undefined 
            };
            const microMovement3 = { 
                position: { lat: 45.501700001, lon: -73.567300009 }, 
                lastEnergyLevel: undefined 
            };
            const microMovement4 = { 
                position: { lat: 45.50171, lon: -73.5673 }, 
                lastEnergyLevel: undefined 
            };
            
            expect(hasVehicleMoved(baseState, microMovement1)).toBe(false);
            expect(hasVehicleMoved(baseState, microMovement2)).toBe(false);
            expect(hasVehicleMoved(baseState, microMovement3)).toBe(false);
            expect(hasVehicleMoved(baseState, microMovement4)).toBe(false);
            
            // Mouvements significatifs qui devraient être détectés (changements au 4e chiffre)
            const significantMovement1 = { 
                position: { lat: 45.5018, lon: -73.5673 }, 
                lastEnergyLevel: undefined 
            };
            const significantMovement2 = { 
                position: { lat: 45.5017, lon: -73.5674 }, 
                lastEnergyLevel: undefined 
            };
            const minimalSignificantMovement = { 
                position: { lat: 45.5017, lon: -73.5672 }, 
                lastEnergyLevel: undefined 
            };
            
            expect(hasVehicleMoved(baseState, significantMovement1)).toBe(true);
            expect(hasVehicleMoved(baseState, significantMovement2)).toBe(true);
            expect(hasVehicleMoved(baseState, minimalSignificantMovement)).toBe(true);
        });

        test('détecte les changements de niveau d\'énergie même sans mouvement de position', () => {
            const baseState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: 85 
            };
            
            // Même position, mais niveau d'énergie différent
            const energyChangedState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: 83 
            };
            
            expect(hasVehicleMoved(baseState, energyChangedState)).toBe(true);
        });

        test('ne détecte pas de mouvement si position et énergie sont identiques', () => {
            const baseState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: 85 
            };
            
            const identicalState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: 85 
            };
            
            expect(hasVehicleMoved(baseState, identicalState)).toBe(false);
        });

        test('détecte les changements quand position ET énergie changent', () => {
            const baseState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: 85 
            };
            
            const bothChangedState = { 
                position: { lat: 45.5018, lon: -73.5674 }, 
                lastEnergyLevel: 80 
            };
            
            expect(hasVehicleMoved(baseState, bothChangedState)).toBe(true);
        });

        test('ignore les changements d\'énergie si l\'un des niveaux est undefined', () => {
            const baseState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: undefined 
            };
            
            const energyDefinedState = { 
                position: { lat: 45.5017, lon: -73.5673 }, 
                lastEnergyLevel: 85 
            };
            
            // Position identique, énergie non comparée car l'une est undefined
            expect(hasVehicleMoved(baseState, energyDefinedState)).toBe(false);
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
