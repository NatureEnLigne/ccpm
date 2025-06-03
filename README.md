# 📍 Application cartographique Ponthieu-Marquenterre

Application web interactive pour visualiser les données naturalistes des communes de la communauté de communes Ponthieu-Marquenterre (CCPM).

## 🎯 Objectifs

- **Carte interactive** : Visualisation des communes sur Mapbox
- **Fiches communes** : Informations détaillées avec design glassmorphique  
- **Tableaux de bord** : Graphiques interactifs des données naturalistes
- **Données locales** : Basé sur fichiers CSV et GeoJSON (pas de backend)

## 🛠️ Stack technique

- **Framework** : Next.js 14 + TypeScript
- **Cartographie** : Mapbox GL JS
- **Visualisations** : Nivo
- **State Management** : Zustand
- **Styling** : Tailwind CSS
- **Données** : CSV (papaparse) + GeoJSON

## 🚀 Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd ccpm

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

## 📊 Données utilisées

- `ccpm.geojson` : Géométries des communes
- `synthese_insee.csv` : Synthèse observations par commune
- `pheno_mois_insee.csv` : Phénologie par mois
- `taxonomie.csv` : Informations taxonomiques
- `lists_rouges.csv` : Statuts listes rouges
- `statuts.csv` : Statuts réglementaires

## 🔧 Configuration

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWJyb3V0aW4iLCJhIjoiY21iZzU4OHAxMjhqcTJscXUwNGp3ZXVwdCJ9.XHkFEC_OBMp7B0UqDkE8Tg
```

## 📁 Structure du projet

```
ccpm/
├── assets/data/          # Fichiers de données
├── components/           # Composants React
│   ├── Map.tsx
│   ├── Sidebar.tsx
│   ├── CommuneCard.tsx
│   └── dashboards/       # Graphiques
├── pages/               # Pages Next.js
│   ├── index.tsx
│   └── commune/[code_insee].tsx
├── utils/               # Utilitaires
└── styles/              # Styles globaux
```

## 🎨 Fonctionnalités

### 🗺️ Carte principale
- Affichage des communes CCPM
- Sélection par clic avec zoom
- Toggle bâtiments 3D
- Sélecteur de fonds de carte

### 🧊 Fiche commune
- Design glassmorphique
- Infos de base (superficie, INSEE, observations)
- Lien vers page détaillée

### 📊 Tableaux de bord
- **Bubble chart** : Groupes taxonomiques
- **Courbe** : Phénologie mensuelle  
- **Barres empilées** : Listes rouges
- **Treemap** : Statuts réglementaires

## 🔄 Interactions

- Filtrage croisé entre graphiques
- Synchronisation des données
- États de chargement et d'erreur

## 📦 Déploiement

Compatible avec Live Server pour développement local :

```bash
npm run build
# Servir le dossier /out avec Live Server
```

## 📝 TODO

Voir le fichier `todo.md` pour la liste complète des tâches.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request 