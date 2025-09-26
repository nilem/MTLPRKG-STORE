import { getAvailableVehicules } from '../src/fetchMapLayers.js';
import { VehicleTracker } from '../src/VehicleTracker.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        console.log('Démarrage de la récupération des données de véhicules...');
        
        // Récupérer les données des véhicules disponibles depuis l'API
        const apiVehicleData = await getAvailableVehicules();
        
        if (!apiVehicleData) {
            console.error('Aucune donnée de véhicule récupérée depuis l\'API');
            process.exit(1);
        }

        // Créer le dossier docs s'il n'existe pas
        const docsDir = path.join(__dirname, '..', 'docs');
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        // Initialiser le tracker de véhicules
        const tracker = new VehicleTracker();
        const outputPath = path.join(docsDir, 'vehiculeUsages.latest.json');
        
        // Charger les données existantes si disponibles
        if (fs.existsSync(outputPath)) {
            try {
                const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
                tracker.loadExistingData(existingData);
                console.log('Données existantes chargées avec succès');
            } catch (error) {
                console.warn('Impossible de charger les données existantes:', error.message);
            }
        }

        // Traiter les nouvelles données
        const processedData = tracker.processVehicleData(apiVehicleData);
        
        // Ajouter des métadonnées
        const finalData = {
            ...processedData,
            lastUpdate: new Date().toLocaleString('fr-CA', { timeZone: 'America/Montreal' })
        };
        
        // Sauvegarder les données traitées
        fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
        
        console.log(`Données sauvegardées avec succès dans ${outputPath}`);
        console.log(`Véhicules traités: ${finalData.totalVehicles}`);
        console.log(`Timestamp: ${finalData.timestamp}`);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        process.exit(1);
    }
}

main();
