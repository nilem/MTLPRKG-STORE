# MTLPRKG-STORE

Application pour récupérer et servir les données de véhicules disponibles à Montréal via l'API Vulog.

## 🚀 Fonctionnalités

- Récupération automatique des données de véhicules toutes les heures
- API REST accessible publiquement via GitHub Pages
- Déploiement automatisé avec GitHub Actions

## 📊 API

Les données sont disponibles publiquement à l'adresse :
```
https://nilem.github.io/MTLPRKG-STORE/vehiculeUsages.latest.json
```

### Structure des données

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "lastUpdate": "2024-01-01 07:00:00",
  "data": {
    "vehicles": [...],
    // Autres propriétés de l'API Vulog
  }
}
```

## 🔧 Configuration

### GitHub Actions

Le workflow se trouve dans `.github/workflows/fetch-vehicle-data.yml` et :
- S'exécute automatiquement toutes les heures
- Récupère les données via l'API Vulog
- Met à jour le fichier JSON
- Déploie sur GitHub Pages

### GitHub Pages

Pour activer GitHub Pages :
1. Allez dans les paramètres de votre repository
2. Section "Pages"
3. Source : "GitHub Actions"

## 🛠 Développement Local

```bash
# Installer les dépendances
npm install

# Exécuter la récupération des données localement
npm run fetch-data
```

## 📝 Structure du Projet

```
├── .github/workflows/
│   └── fetch-vehicle-data.yml    # Workflow GitHub Actions
├── docs/
│   ├── index.html                # Page d'accueil de l'API
│   └── vehiculeUsages.latest.json # Données JSON
├── scripts/
│   └── fetchVehicleData.js       # Script de récupération
├── src/
│   └── fetchMapLayers.js         # Module de récupération de données
└── package.json                  # Configuration Node.js
```

## 🔑 API Vulog

Ce projet utilise l'API Vulog avec les configurations suivantes :
- Endpoint d'authentification : `https://aima-us.vulog.net/auth/realms/LEO-CAMTR/protocol/openid-connect/token`
- API de données : `https://aima-us.vulog.net/apiv5`
- Ville : Montréal (ID: `81580773-9478-4d76-86c1-3128d13538cf`)
