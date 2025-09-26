import { hasVehicleMoved, isValidPosition } from './utils/geoUtils.js';

/**
 * Classe pour suivre les mouvements des véhicules
 */
export class VehicleTracker {
    constructor() {
        this.vehicles = new Map();
    }

    /**
     * Traite les nouvelles données de véhicules et met à jour le suivi
     * @param {Array} vehicleData Données des véhicules provenant de l'API
     * @returns {Object} Données transformées avec suivi des mouvements
     */
    processVehicleData(vehicleData) {
        if (!Array.isArray(vehicleData)) {
            throw new Error('Vehicle data must be an array');
        }

        const currentTime = new Date().toISOString();
        const updatedVehicles = {};

        for (const vehicle of vehicleData) {
            const plate = vehicle.description?.plate;
            const newPosition = vehicle.location?.position;

            if (!plate) {
                console.warn('Vehicle without plate found, skipping:', vehicle.description?.id);
                continue;
            }

            if (!isValidPosition(newPosition)) {
                console.warn(`Invalid position for vehicle ${plate}:`, newPosition);
                continue;
            }

            const existingVehicle = this.vehicles.get(plate);

            if (!existingVehicle) {
                // Nouveau véhicule
                updatedVehicles[plate] = {
                    position: newPosition,
                    lastUpdate: currentTime,
                    firstSeen: currentTime,
                    movementHistory: []
                };
            } else {
                // Véhicule existant - vérifier s'il a bougé
                const hasMoved = hasVehicleMoved(existingVehicle.position, newPosition);

                if (hasMoved) {
                    // Le véhicule a bougé
                    const movementRecord = {
                        from: existingVehicle.position,
                        to: newPosition,
                        timestamp: currentTime
                    };

                    updatedVehicles[plate] = {
                        position: newPosition,
                        lastUpdate: currentTime,
                        firstSeen: existingVehicle.firstSeen,
                        movementHistory: [
                            ...existingVehicle.movementHistory.slice(-9), // Garder les 9 derniers mouvements
                            movementRecord
                        ]
                    };
                } else {
                    // Le véhicule n'a pas bougé - garder les données existantes
                    updatedVehicles[plate] = existingVehicle;
                }
            }

            // Mettre à jour le cache interne
            this.vehicles.set(plate, updatedVehicles[plate]);
        }

        return {
            timestamp: currentTime,
            totalVehicles: Object.keys(updatedVehicles).length,
            vehicles: updatedVehicles
        };
    }

    /**
     * Charge les données existantes depuis un fichier JSON
     * @param {Object} existingData Données existantes
     */
    loadExistingData(existingData) {
        if (!existingData || !existingData.vehicles) {
            return;
        }

        this.vehicles.clear();
        for (const [plate, vehicleInfo] of Object.entries(existingData.vehicles)) {
            this.vehicles.set(plate, vehicleInfo);
        }
    }

    /**
     * Obtient les statistiques des véhicules suivis
     * @returns {Object} Statistiques
     */
    getStatistics() {
        const stats = {
            totalVehicles: this.vehicles.size,
            vehiclesWithMovements: 0,
            totalMovements: 0
        };

        for (const vehicle of this.vehicles.values()) {
            if (vehicle.movementHistory && vehicle.movementHistory.length > 0) {
                stats.vehiclesWithMovements++;
                stats.totalMovements += vehicle.movementHistory.length;
            }
        }

        return stats;
    }

    /**
     * Nettoie les anciens véhicules qui n'ont pas été vus récemment
     * @param {number} maxAgeHours Âge maximum en heures (défaut: 24h)
     */
    cleanupOldVehicles(maxAgeHours = 24) {
        const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
        const vehiclesToRemove = [];

        for (const [plate, vehicle] of this.vehicles.entries()) {
            const lastUpdate = new Date(vehicle.lastUpdate);
            if (lastUpdate < cutoffTime) {
                vehiclesToRemove.push(plate);
            }
        }

        vehiclesToRemove.forEach(plate => this.vehicles.delete(plate));
        
        return vehiclesToRemove.length;
    }
}
