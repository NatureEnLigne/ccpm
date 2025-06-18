# 🚀 Checklist de Déploiement - CCPM Cartographie

## ✅ Vérifications Effectuées

### 🔑 Clé API Mapbox
- ✅ **Clé configurée** : `pk.eyJ1IjoibWJyb3V0aW4iLCJhIjoiY21iZzU4OHAxMjhqcTJscXUwNGp3ZXVwdCJ9.XHkFEC_OBMp7B0UqDkE8Tg`
- ✅ **Stockage sécurisé** : Dans `.env.local` (exclus du versioning)
- ✅ **Usage correct** : Variable `NEXT_PUBLIC_MAPBOX_TOKEN` utilisée via `process.env`
- ✅ **Aucune clé hardcodée** : Vérifiée dans tout le codebase

### 🛡️ Sécurité
- ✅ **En-têtes HTTP** : Configurés dans `next.config.js`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- ✅ **Fichiers sensibles** : Exclus via `.gitignore`
- ✅ **Variables d'environnement** : Préfixe `NEXT_PUBLIC_` correct
- ✅ **Aucun secret exposé** : Audit complet effectué

### 🔧 Build & Export
- ✅ **Build réussi** : `npm run build` sans erreurs
- ✅ **Export statique** : Configuration `output: 'export'` ajoutée
- ✅ **75 pages générées** : Toutes les communes + pages principales
- ✅ **Taille optimisée** : Bundle principal 87.4 kB

### ⚠️ Vulnérabilités Identifiées
- **5 vulnérabilités** dans `react-d3-cloud` (dépendance d3-color)
- **Impact** : Faible - ReDoS sur parsing couleurs
- **Action recommandée** : Mise à jour post-déploiement si nécessaire

### 📁 Structure d'Export
```
out/
├── index.html              # Page principale
├── commune/                # 71 pages communes
├── _next/                  # Assets JS/CSS optimisés
└── assets/                 # Données CSV/GeoJSON
```

## 🌐 Instructions de Déploiement

### Option 1 : Hébergement Statique (Netlify, Vercel, GitHub Pages)
1. Zipper le dossier `out/`
2. Uploader sur votre plateforme
3. **Important** : Configurer les variables d'environnement :
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWJyb3V0aW4iLCJhIjoiY21iZzU4OHAxMjhqcTJscXUwNGp3ZXVwdCJ9.XHkFEC_OBMp7B0UqDkE8Tg
   ```

### Option 2 : Serveur Web Classique
1. Copier le contenu de `out/` vers votre serveur web
2. Configurer les en-têtes HTTP (si possible)
3. Redirection 404 vers `/404.html`

## 🔒 Actions Post-Déploiement

### 1. Sécurité Mapbox
- [ ] Connectez-vous à [Mapbox Studio](https://studio.mapbox.com/)
- [ ] Aller dans "Access Tokens"
- [ ] Configurer les **domaines autorisés** pour votre clé
- [ ] Exemple : `monsite.com`, `www.monsite.com`

### 2. Monitoring
- [ ] Vérifier le chargement de la carte
- [ ] Tester les interactions (clic communes, graphiques)
- [ ] Vérifier les en-têtes de sécurité : `curl -I https://votre-domaine.com`

### 3. Performance
- [ ] Test Google PageSpeed Insights
- [ ] Vérifier le temps de chargement des 71 communes
- [ ] Optimiser le cache si nécessaire

## 🆘 Résolution des Problèmes

### Carte ne se charge pas
1. Vérifier la clé Mapbox dans les DevTools
2. Contrôler les restrictions de domaine
3. Vérifier les CORS si hébergement custom

### Données manquantes
1. Vérifier que le dossier `assets/` est bien uploadé
2. Contrôler les chemins relatifs des CSV/GeoJSON

### Erreurs console
1. Activer les logs de debug en développement
2. Vérifier les importations des dépendances

## 📞 Support
En cas de problème, vérifier dans l'ordre :
1. Configuration Mapbox
2. Variables d'environnement
3. Fichiers assets présents
4. En-têtes de sécurité

---

**✅ Projet prêt pour la production !**
*Dernière vérification : 18 juin 2024* 