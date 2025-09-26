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
        const newVehicleDataMap = new Map(vehicleData.map(v => [v.description?.plate, v]));
        
        // Mettre à jour les véhicules existants et identifier les nouveaux
        const newPlates = new Set();
        for (const [plate, vehicle] of newVehicleDataMap.entries()) {
            if (!plate) {
                console.warn('Vehicle without plate found, skipping:', vehicle.description?.id);
                continue;
            }

            const newPosition = vehicle.location?.position;
            if (!isValidPosition(newPosition)) {
                console.warn(`Invalid position for vehicle ${plate}:`, newPosition);
                continue;
            }

            const existingVehicle = this.vehicles.get(plate);

            if (existingVehicle) {
                // Véhicule existant
                const hasMoved = hasVehicleMoved(existingVehicle.position, newPosition);
                if (hasMoved) {
                    existingVehicle.position = newPosition;
                    existingVehicle.lastUpdate = currentTime;
                }
            } else {
                // Nouveau véhicule
                this.vehicles.set(plate, {
                    position: newPosition,
                    lastUpdate: currentTime,
                });
            }
            newPlates.add(plate);
        }

        // Supprimer les véhicules qui ne sont plus dans l'API
        for (const plate of this.vehicles.keys()) {
            if (!newVehicleDataMap.has(plate)) {
                // On pourrait vouloir les supprimer, mais la logique précédente les gardait.
                // Pour l'instant, on les garde. Si on veut les supprimer:
                // this.vehicles.delete(plate);
            }
        }

        // Convertir la Map en objet pour le retour, l'ordre est préservé
        const updatedVehiclesObject = Object.fromEntries(this.vehicles);

        return {
            timestamp: currentTime,
            totalVehicles: this.vehicles.size,
            vehicles: updatedVehiclesObject
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
