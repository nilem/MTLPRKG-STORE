import { getAvailableVehicules } from '../src/fetchMapLayers.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        console.log('Démarrage de la récupération des données de véhicules...');
        
        // Récupérer les données des véhicules disponibles
        const vehicleData = await getAvailableVehicules();
        
        if (!vehicleData) {
            console.error('Aucune donnée de véhicule récupérée');
            process.exit(1);
        }
        
        // Ajouter un timestamp aux données
        const dataWithTimestamp = {
            timestamp: new Date().toISOString(),
            lastUpdate: new Date().toLocaleString('fr-CA', { timeZone: 'America/Montreal' }),
            data: vehicleData
        };
        
        // Créer le dossier docs s'il n'existe pas
        const docsDir = path.join(__dirname, '..', 'docs');
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }
        
        // Sauvegarder les données dans le fichier JSON
        const outputPath = path.join(docsDir, 'vehiculeUsages.latest.json');
        fs.writeFileSync(outputPath, JSON.stringify(dataWithTimestamp, null, 2));
        
        console.log(`Données sauvegardées avec succès dans ${outputPath}`);
        console.log(`Nombre de véhicules: ${vehicleData?.vehicles?.length || 'Non disponible'}`);
        console.log(`Timestamp: ${dataWithTimestamp.timestamp}`);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        process.exit(1);
    }
}

main();
