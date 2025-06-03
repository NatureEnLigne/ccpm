# 📍 PRD – Application cartographique Ponthieu-Marquenterre (version CSV/GeoJSON)

## 🎯 Objectif

Créer une application cartographique interactive sur les **communes de la communauté de communes Ponthieu-Marquenterre** (CCPM), permettant de :
- Visualiser les communes sur une carte Mapbox.
- Sélectionner une commune pour afficher une **fiche résumé glassmorphique**.
- Consulter une page avec **tableaux de bord interactifs** sur les données naturalistes.
- Basée uniquement sur des fichiers **CSV et GeoJSON** en local (pas de backend pour la v1).

---

## 🛠️ Stack technique

| Élément       | Technologie |
|--------------|-------------|
| Framework    | Next.js (React) + TypeScript |
| Cartographie | Mapbox GL JS |
| Données      | Fichiers CSV + GeoJSON dans `/assets/data/` |
| Visualisation| Nivo (bubbles, bar, line, treemap) |
| UI / CSS     | Tailwind CSS + effet glassmorphique |
| Parsing CSV  | `papaparse` ou équivalent |

---

## 📁 Données utilisées

### 🗺 Fichier de géométrie
- **`ccpm.geojson`**  
  → Polygones des communes de la CCPM  
  → Propriété `Insee` utilisée pour la jointure

### 📊 Fichiers CSV dans `/assets/data/`

| Fichier | Description |
|--------|-------------|
| `synthese_insee.csv` | Synthèse des observations par commune |
| `pheno_mois_insee.csv` | Nombre d’observations par mois et commune |
| `taxonomie.csv` | Infos taxonomiques sur les espèces (groupes) |
| `lists_rouges.csv` | Statuts de listes rouges par taxon |
| `statuts.csv` | Statuts réglementaires par taxon |

---

## 🔗 Relations entre les fichiers

- `ccpm.geojson.Insee` = `synthese_insee.Insee`
- `synthese_insee.Cd Ref` = `pheno_mois_insee.CD REF`
- `synthese_insee.Cd Ref` = `taxonomie.Cd Nom`
- `taxonomie.Cd Nom` = `lists_rouges.CD NOM`
- `taxonomie.Cd Nom` = `statuts.CD NOM`

---

## 📌 Fonctionnalités

### 🗺 Carte Mapbox
- Chargement des communes depuis `ccpm.geojson`
- Clic sur une commune : zoom + affichage d’une **fiche commune**
- Liste latérale des communes
- **Toggle "Afficher bâtiments 3D"** (extrusion Mapbox)
- **Sélecteur de fond de plan** (styles Mapbox)

### 🧊 Fiche commune (glassmorphism)
- Nom de la commune
- Superficie, code INSEE, nombre total d’observations
- Bouton : "Voir la fiche complète"

### 📊 Page fiche commune (`/commune/[code_insee]`)
Graphiques interactifs :
- Bubble chart (groupes taxonomiques) ← `synthese_insee` + `taxonomie`
- Courbe phénologie (mois) ← `pheno_mois_insee`
- Barres empilées (listes rouges) ← `taxonomie` + `lists_rouges`
- Treemap (statuts) ← `taxonomie` + `statuts`

### 🔁 Interactions
- Clics/hover sur les graphiques → filtres croisés sur les autres.
- Filtres actifs enregistrés dans un état global (`useState` ou `Zustand`).

---

## 📂 Structure projet recommandée
assets/data
├── ccpm.geojson
├── synthese_insee.csv
├── pheno_mois_insee.csv
├── taxonomie.csv
├── lists_rouges.csv
└── statuts.csv

/pages
├── index.tsx
└── commune/[code_insee].tsx

/components
├── Map.tsx
├── CommuneCard.tsx
├── Sidebar.tsx
├── dashboards/
├── GroupBubble.tsx
├── PhenoLine.tsx
├── RedListBar.tsx
└── StatusTreemap.tsx

/utils
├── csvLoader.ts
├── geojsonLoader.ts
├── dataJoiner.ts
└── formatters.ts

---

## ✅ MVP v1

- Carte Mapbox affichant les communes CCPM
- Liste latérale avec toggle 3D et fond de plan
- Fiche commune au clic (avec données issues de `synthese_insee`)
- Page commune avec au moins 2 graphiques interactifs
- Lecture des fichiers en local (`fetch + papaparse`)

---

## 🧠 Notes pour Cursor AI

- Utiliser ce PRD comme base pour la génération de composants ou de scripts d’intégration.
- Prioriser le système de chargement asynchrone des CSV et leur parsing via `papaparse`.
- Les interactions croisées doivent reposer sur un `store` centralisé (Zustand ou React context).