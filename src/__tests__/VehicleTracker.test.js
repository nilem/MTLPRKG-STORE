import { VehicleTracker } from '../VehicleTracker.js';

describe('VehicleTracker', () => {
    let tracker;

    beforeEach(() => {
        tracker = new VehicleTracker();
    });

    describe('processVehicleData', () => {
        test('traite correctement un nouveau véhicule', () => {
            const vehicleData = [{
                description: { plate: 'ABC123', id: 'vehicle1' },
                location: { position: { lat: 45.5017, lon: -73.5673 } }
            }];

            const result = tracker.processVehicleData(vehicleData);

            expect(result.totalVehicles).toBe(1);
            expect(result.vehicles['ABC123']).toBeDefined();
            expect(result.vehicles['ABC123'].position).toEqual({ lat: 45.5017, lon: -73.5673 });
            expect(result.vehicles['ABC123'].lastUpdate).toBeDefined();
        });

        test('détecte quand un véhicule a bougé', async () => {
            const initialData = [{
                description: { plate: 'ABC123' },
                location: { position: { lat: 45.5017, lon: -73.5673 } }
            }];

            const movedData = [{
                description: { plate: 'ABC123' },
                location: { position: { lat: 45.5018, lon: -73.5673 } } // Coordonnées différentes
            }];

            // Premier traitement
            tracker.processVehicleData(initialData);
            const firstUpdate = tracker.vehicles.get('ABC123').lastUpdate;
            
            // Pour s'assurer que le timestamp change
            await new Promise(resolve => setTimeout(resolve, 1));

            // Deuxième traitement avec position différente
            tracker.processVehicleData(movedData);
            const updatedVehicle = tracker.vehicles.get('ABC123');

            expect(updatedVehicle.position).toEqual({ lat: 45.5018, lon: -73.5673 });
            expect(updatedVehicle.lastUpdate).not.toBe(firstUpdate);
        });

        test('ne met pas à jour si le véhicule n\'a pas bougé', () => {
            const initialData = [{
                description: { plate: 'ABC123' },
                location: { position: { lat: 45.5017, lon: -73.5673 } }
            }];

            const samePositionData = [{
                description: { plate: 'ABC123' },
                location: { position: { lat: 45.5017, lon: -73.5673 } } // Coordonnées identiques
            }];

            // Premier traitement
            const firstResult = tracker.processVehicleData(initialData);
            const firstUpdate = firstResult.vehicles['ABC123'].lastUpdate;
            
            // Deuxième traitement avec position similaire
            tracker.processVehicleData(samePositionData);
            const finalVehicleState = tracker.vehicles.get('ABC123');

            expect(finalVehicleState.lastUpdate).toBe(firstUpdate); // Pas mis à jour
        });

        test('ignore les véhicules sans plaque d\'immatriculation', () => {
            const vehicleData = [
                {
                    description: { id: 'vehicle1' }, // Pas de plaque
                    location: { position: { lat: 45.5017, lon: -73.5673 } }
                },
                {
                    description: { plate: 'ABC123', id: 'vehicle2' },
                    location: { position: { lat: 45.5027, lon: -73.5673 } }
                }
            ];

            const result = tracker.processVehicleData(vehicleData);

            expect(result.totalVehicles).toBe(1);
            expect(result.vehicles['ABC123']).toBeDefined();
        });

        test('ignore les véhicules avec des positions invalides', () => {
            const vehicleData = [
                {
                    description: { plate: 'ABC123' },
                    location: { position: { lat: 91, lon: -73.5673 } } // Latitude invalide
                },
                {
                    description: { plate: 'DEF456' },
                    location: { position: { lat: 45.5017, lon: -73.5673 } }
                }
            ];

            const result = tracker.processVehicleData(vehicleData);

            expect(result.totalVehicles).toBe(1);
            expect(result.vehicles['DEF456']).toBeDefined();
            expect(result.vehicles['ABC123']).toBeUndefined();
        });

        test('maintient l\'ordre des véhicules et ajoute les nouveaux à la fin', () => {
            const initialData = [
                { description: { plate: 'ABC123' }, location: { position: { lat: 1, lon: 1 } } },
                { description: { plate: 'DEF456' }, location: { position: { lat: 2, lon: 2 } } }
            ];
            tracker.processVehicleData(initialData);

            const newData = [
                { description: { plate: 'GHI789' }, location: { position: { lat: 3, lon: 3 } } }, // Nouveau
                { description: { plate: 'ABC123' }, location: { position: { lat: 1.1, lon: 1.1 } } } // Existant
            ];
            tracker.processVehicleData(newData);

            const vehicleKeys = Array.from(tracker.vehicles.keys());
            expect(vehicleKeys).toEqual(['ABC123', 'DEF456', 'GHI789']);
        });

        test('met à jour lastUpdate quand le niveau d\'énergie change même sans mouvement', async () => {
            const initialData = [
                { 
                    description: { plate: 'ABC123', energyLevel: 90 }, 
                    location: { position: { lat: 1, lon: 1 } } 
                }
            ];
            
            // Premier traitement
            tracker.processVehicleData(initialData);
            const firstUpdate = tracker.vehicles.get('ABC123').lastUpdate;
            expect(tracker.vehicles.get('ABC123').lastEnergyLevel).toBe(90);
            
            // Attendre un peu pour s'assurer que le timestamp change
            await new Promise(resolve => setTimeout(resolve, 2));
            
            // Deuxième traitement - même position mais énergie différente
            const energyChangedData = [
                { 
                    description: { plate: 'ABC123', energyLevel: 87 }, 
                    location: { position: { lat: 1, lon: 1 } } // Même position
                }
            ];
            tracker.processVehicleData(energyChangedData);
            
            // L'énergie a changé, donc lastUpdate devrait être mis à jour
            expect(tracker.vehicles.get('ABC123').lastUpdate).not.toBe(firstUpdate);
            expect(tracker.vehicles.get('ABC123').lastEnergyLevel).toBe(87);
            expect(tracker.vehicles.get('ABC123').position).toEqual({ lat: 1, lon: 1 }); // Position inchangée
        });
    });

    describe('loadExistingData', () => {
        test('charge correctement les données existantes', () => {
            const existingData = {
                vehicles: {
                    'ABC123': {
                        position: { lat: 45.5017, lon: -73.5673 },
                        lastUpdate: '2023-01-01T11:00:00Z'
                    }
                }
            };

            tracker.loadExistingData(existingData);

            expect(tracker.vehicles.size).toBe(1);
            expect(tracker.vehicles.get('ABC123')).toEqual(existingData.vehicles['ABC123']);
        });

        test('gère les données inexistantes ou invalides', () => {
            expect(() => tracker.loadExistingData(null)).not.toThrow();
            expect(() => tracker.loadExistingData({})).not.toThrow();
            expect(() => tracker.loadExistingData({ vehicles: null })).not.toThrow();
            
            expect(tracker.vehicles.size).toBe(0);
        });
    });

    describe('cleanupOldVehicles', () => {
        test('supprime les véhicules anciens', () => {
            const now = new Date();
            const oldDate = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 heures
            const recentDate = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 heure

            tracker.vehicles.set('OLD123', {
                lastUpdate: oldDate.toISOString()
            });
            tracker.vehicles.set('RECENT456', {
                lastUpdate: recentDate.toISOString()
            });

            const removedCount = tracker.cleanupOldVehicles(24);

            expect(removedCount).toBe(1);
            expect(tracker.vehicles.has('OLD123')).toBe(false);
            expect(tracker.vehicles.has('RECENT456')).toBe(true);
        });

        test('utilise la valeur par défaut de 24 heures', () => {
            const now = new Date();
            const oldDate = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 heures

            tracker.vehicles.set('OLD123', {
                lastUpdate: oldDate.toISOString()
            });

            const removedCount = tracker.cleanupOldVehicles();

            expect(removedCount).toBe(1);
            expect(tracker.vehicles.size).toBe(0);
        });
    });
});
