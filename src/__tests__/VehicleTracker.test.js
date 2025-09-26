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
            expect(result.vehicles['ABC123'].firstSeen).toBeDefined();
            expect(result.vehicles['ABC123'].lastUpdate).toBeDefined();
            expect(result.vehicles['ABC123'].movementHistory).toEqual([]);
        });

        test('détecte quand un véhicule a bougé', () => {
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
            
            // Deuxième traitement avec position différente
            const result = tracker.processVehicleData(movedData);

            expect(result.vehicles['ABC123'].movementHistory).toHaveLength(1);
            expect(result.vehicles['ABC123'].movementHistory[0]).toMatchObject({
                from: { lat: 45.5017, lon: -73.5673 },
                to: { lat: 45.5018, lon: -73.5673 }
            });
            expect(result.vehicles['ABC123'].position).toEqual({ lat: 45.5018, lon: -73.5673 });
        });

        test('ne crée pas d\'historique si le véhicule n\'a pas bougé', () => {
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
            const result = tracker.processVehicleData(samePositionData);

            expect(result.vehicles['ABC123'].movementHistory).toHaveLength(0);
            expect(result.vehicles['ABC123'].lastUpdate).toBe(firstUpdate); // Pas mis à jour
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

        test('limite l\'historique des mouvements à 10 entrées', () => {
            const plate = 'ABC123';
            let currentLat = 45.5017;

            // Ajouter un véhicule initial
            tracker.processVehicleData([{
                description: { plate },
                location: { position: { lat: currentLat, lon: -73.5673 } }
            }]);

            // Simuler 15 mouvements
            for (let i = 0; i < 15; i++) {
                currentLat += 0.001; // Déplacer le véhicule
                tracker.processVehicleData([{
                    description: { plate },
                    location: { position: { lat: currentLat, lon: -73.5673 } }
                }]);
            }

            const result = tracker.processVehicleData([{
                description: { plate },
                location: { position: { lat: currentLat, lon: -73.5673 } }
            }]);

            expect(result.vehicles[plate].movementHistory.length).toBeLessThanOrEqual(10);
        });

        test('lève une erreur si les données ne sont pas un tableau', () => {
            expect(() => {
                tracker.processVehicleData('invalid');
            }).toThrow('Vehicle data must be an array');

            expect(() => {
                tracker.processVehicleData(null);
            }).toThrow('Vehicle data must be an array');
        });
    });

    describe('loadExistingData', () => {
        test('charge correctement les données existantes', () => {
            const existingData = {
                vehicles: {
                    'ABC123': {
                        position: { lat: 45.5017, lon: -73.5673 },
                        firstSeen: '2023-01-01T10:00:00Z',
                        lastUpdate: '2023-01-01T11:00:00Z',
                        movementHistory: []
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

    describe('getStatistics', () => {
        test('calcule correctement les statistiques', () => {
            // Ajouter des véhicules avec et sans mouvements
            tracker.vehicles.set('ABC123', {
                movementHistory: [{ from: {}, to: {}, timestamp: '' }]
            });
            tracker.vehicles.set('DEF456', {
                movementHistory: []
            });
            tracker.vehicles.set('GHI789', {
                movementHistory: [{ from: {}, to: {}, timestamp: '' }, { from: {}, to: {}, timestamp: '' }]
            });

            const stats = tracker.getStatistics();

            expect(stats.totalVehicles).toBe(3);
            expect(stats.vehiclesWithMovements).toBe(2);
            expect(stats.totalMovements).toBe(3);
        });

        test('retourne des statistiques vides pour un tracker vide', () => {
            const stats = tracker.getStatistics();

            expect(stats.totalVehicles).toBe(0);
            expect(stats.vehiclesWithMovements).toBe(0);
            expect(stats.totalMovements).toBe(0);
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
