# 📋 TODO - Application cartographique Ponthieu-Marquenterre

## 🎯 Phase 1 : Configuration initiale
- [x] Initialiser le projet Git
- [x] Configurer Next.js 14 avec TypeScript
- [x] Installer les dépendances principales
  - [x] Mapbox GL JS + types
  - [x] Tailwind CSS
  - [x] Papaparse pour CSV
  - [x] Nivo pour visualisations
  - [x] Zustand pour le state management
- [x] Configurer Tailwind avec les styles glassmorphiques
- [x] Créer la structure de dossiers recommandée

## 🗂️ Phase 2 : Préparation des données
- [x] Créer le dossier `/assets/data/`
- [x] Ajouter les fichiers de données :
  - [x] `ccpm.geojson`
  - [x] `synthese_insee.csv`
  - [x] `pheno_mois_insee.csv`
  - [x] `taxonomie.csv`
  - [x] `lists_rouges.csv`
  - [x] `statuts.csv`
- [ ] Créer les utilitaires de chargement :
  - [ ] `utils/csvLoader.ts`
  - [ ] `utils/geojsonLoader.ts`
  - [ ] `utils/dataJoiner.ts`
  - [ ] `utils/formatters.ts`

## 🗺️ Phase 3 : Carte principale
- [ ] Créer `components/Map.tsx`
  - [ ] Intégration Mapbox GL JS
  - [ ] Configuration avec la clé API
  - [ ] Chargement du GeoJSON des communes
  - [ ] Gestion des clics sur les communes
  - [ ] Zoom automatique sur sélection
- [ ] Créer `components/Sidebar.tsx`
  - [ ] Liste des communes
  - [ ] Toggle "Afficher bâtiments 3D"
  - [ ] Sélecteur de fond de plan Mapbox
- [ ] Page principale `pages/index.tsx`
  - [ ] Layout avec carte et sidebar
  - [ ] Intégration des composants

## 🧊 Phase 4 : Fiche commune (glassmorphism)
- [ ] Créer `components/CommuneCard.tsx`
  - [ ] Design glassmorphique avec Tailwind
  - [ ] Affichage des infos de base
  - [ ] Bouton "Voir la fiche complète"
- [ ] Intégrer la fiche dans la carte
  - [ ] Positionnement responsive
  - [ ] Animations d'apparition/disparition

## 📊 Phase 5 : Page fiche commune détaillée
- [ ] Créer `pages/commune/[code_insee].tsx`
  - [ ] Layout de la page
  - [ ] Chargement des données par code INSEE
- [ ] Créer les composants de visualisation :
  - [ ] `components/dashboards/GroupBubble.tsx` (Nivo bubble)
  - [ ] `components/dashboards/PhenoLine.tsx` (Nivo line)
  - [ ] `components/dashboards/RedListBar.tsx` (Nivo bar)
  - [ ] `components/dashboards/StatusTreemap.tsx` (Nivo treemap)

## 🔄 Phase 6 : Interactions croisées
- [ ] Configurer Zustand store
  - [ ] État global des filtres
  - [ ] Actions pour mettre à jour les filtres
- [ ] Implémenter les interactions :
  - [ ] Clics sur graphiques → filtres
  - [ ] Hover effects
  - [ ] Synchronisation entre graphiques
- [ ] Indicateurs visuels des filtres actifs

## 🎨 Phase 7 : Styling et UX
- [ ] Finaliser le design glassmorphique
- [ ] Animations et transitions
- [ ] Responsive design mobile
- [ ] Loading states et spinners
- [ ] États d'erreur
- [ ] Tests sur différents navigateurs

## 🚀 Phase 8 : Optimisations
- [ ] Lazy loading des composants
- [ ] Optimisation des performances Mapbox
- [ ] Mise en cache des données CSV
- [ ] Minification et compression
- [ ] Tests de performance

## 🔍 Phase 9 : Tests et debugging
- [ ] Tests unitaires composants clés
- [ ] Tests d'intégration
- [ ] Validation données CSV
- [ ] Tests responsive
- [ ] Correction des bugs identifiés

## 📦 Phase 10 : Déploiement
- [ ] Configuration pour Live Server
- [ ] Build de production
- [ ] Documentation utilisateur
- [ ] README avec instructions

---

## 📝 Notes techniques
- **Clé API Mapbox** : pk.eyJ1IjoibWJyb3V0aW4iLCJhIjoiY21iZzU4OHAxMjhqcTJscXUwNGp3ZXVwdCJ9.XHkFEC_OBMp7B0UqDkE8Tg
- **Extension utilisée** : Live Server
- **Framework** : Next.js 14 + TypeScript
- **Priorité MVP** : Carte + Sidebar + Fiche commune + 2 graphiques minimum

## 🎯 Objectifs MVP v1
1. ✅ Carte Mapbox fonctionnelle avec communes CCPM
2. ✅ Interaction clic commune → fiche
3. ✅ Page détaillée avec graphiques
4. ✅ Lecture fichiers locaux CSV/GeoJSON
5. ✅ Design glassmorphique cohérent 