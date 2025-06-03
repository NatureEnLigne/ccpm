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
- [x] Créer les utilitaires de chargement :
  - [x] `utils/csvLoader.ts`
  - [x] `utils/geojsonLoader.ts`
  - [x] `utils/dataJoiner.ts`
  - [x] `utils/formatters.ts`

## 🗺️ Phase 3 : Carte principale
- [x] Créer `components/Map.tsx`
  - [x] Intégration Mapbox GL JS
  - [x] Configuration avec la clé API
  - [x] Chargement du GeoJSON des communes
  - [x] Gestion des clics sur les communes
  - [x] Zoom automatique sur sélection
- [x] Créer `components/Sidebar.tsx`
  - [x] Liste des communes
  - [x] Toggle "Afficher bâtiments 3D"
  - [x] Sélecteur de fond de plan Mapbox
- [x] Page principale `pages/index.tsx`
  - [x] Layout avec carte et sidebar
  - [x] Intégration des composants

## 🧊 Phase 4 : Fiche commune (glassmorphism)
- [x] Créer `components/CommuneCard.tsx`
  - [x] Design glassmorphique avec Tailwind
  - [x] Affichage des infos de base
  - [x] Bouton "Voir la fiche complète"
- [x] Intégrer la fiche dans la carte
  - [x] Positionnement responsive
  - [x] Animations d'apparition/disparition

## 📊 Phase 5 : Page fiche commune détaillée
- [x] Créer `pages/commune/[code_insee].tsx`
  - [x] Layout de la page
  - [x] Chargement des données par code INSEE
- [x] Créer les composants de visualisation :
  - [x] `components/dashboards/GroupBubble.tsx` (Nivo bubble)
  - [x] `components/dashboards/PhenoLine.tsx` (Nivo line)
  - [x] `components/dashboards/RedListBar.tsx` (Nivo bar)
  - [x] `components/dashboards/StatusTreemap.tsx` (Nivo treemap)

## 🔄 Phase 6 : Interactions croisées
- [x] Configurer Zustand store
  - [x] État global des filtres
  - [x] Actions pour mettre à jour les filtres
- [x] Implémenter les interactions :
  - [x] Clics sur graphiques → filtres
  - [x] Hover effects
  - [x] Synchronisation entre graphiques
- [x] Indicateurs visuels des filtres actifs

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