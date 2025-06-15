# 🔒 Guide de Sécurité - CCPM Cartographie

## 🛡️ Mesures de sécurité implémentées

### 1. Gestion des clés API
- ✅ **Clé Mapbox** : Stockée dans `.env.local` (non versionnée)
- ✅ **Variables d'environnement** : Préfixe `NEXT_PUBLIC_` pour les variables client
- ✅ **Fichiers sensibles** : Exclus via `.gitignore`

### 2. En-têtes de sécurité HTTP
- ✅ **X-Frame-Options**: `DENY` - Protection contre le clickjacking
- ✅ **X-Content-Type-Options**: `nosniff` - Prévention du MIME sniffing
- ✅ **Referrer-Policy**: `strict-origin-when-cross-origin` - Contrôle des référents
- ✅ **Permissions-Policy**: Désactivation caméra/micro/géolocalisation

### 3. Nettoyage du code
- ✅ **Logs de débogage** : Script automatique de suppression pour la production
- ✅ **Console.error** : Conservés pour le monitoring d'erreurs
- ✅ **Données sensibles** : Aucune donnée personnelle dans les logs

### 4. Configuration Next.js
- ✅ **Images non optimisées** : Pour compatibilité déploiement statique
- ✅ **Fallback filesystem** : Désactivé côté client
- ✅ **Trailing slash** : Activé pour cohérence URLs

## 🚀 Déploiement sécurisé

### Avant la mise en production :

1. **Créer le fichier `.env.local`** :
```bash
echo "NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWJyb3V0aW4iLCJhIjoiY21iZzU4OHAxMjhqcTJscXUwNGp3ZXVwdCJ9.XHkFEC_OBMp7B0UqDkE8Tg" > .env.local
```

2. **Vérifier la sécurité** :
```bash
npm run security-check
```

3. **Build de production** (avec nettoyage des logs) :
```bash
npm run build:prod
```

4. **Vérifier l'exclusion des fichiers sensibles** :
```bash
git status --ignored
```

### Variables d'environnement requises :
- `NEXT_PUBLIC_MAPBOX_TOKEN` : Clé API Mapbox (publique, mais restreinte par domaine)

## ⚠️ Points d'attention

### Clé API Mapbox
- **Type** : Publique (visible côté client)
- **Sécurité** : Restreindre par domaine dans la console Mapbox
- **Rotation** : Changer régulièrement la clé

### Données utilisées
- **Fichiers CSV/GeoJSON** : Données publiques naturalistes
- **Aucune donnée personnelle** : Pas de RGPD à considérer
- **Géolocalisation** : Uniquement données communales publiques

### Logs et monitoring
- **Production** : Logs de débogage supprimés automatiquement
- **Erreurs** : Console.error conservés pour monitoring
- **Pas de données sensibles** : Aucune information personnelle loggée

## 🔍 Audit de sécurité

### Commandes utiles :
```bash
# Vérification des dépendances
npm audit

# Recherche de secrets dans le code
grep -r "pk\." src/ --exclude-dir=node_modules

# Vérification des variables d'environnement
grep -r "process.env" src/

# Test des en-têtes de sécurité (après déploiement)
curl -I https://votre-domaine.com
```

### Checklist pré-déploiement :
- [ ] `.env.local` créé avec la clé API
- [ ] Aucune clé API en dur dans le code
- [ ] Script de nettoyage des logs exécuté
- [ ] Audit de sécurité npm passé
- [ ] En-têtes de sécurité configurés
- [ ] Domaine configuré dans Mapbox Console

## 📞 Contact sécurité

En cas de découverte de vulnérabilité, merci de nous contacter directement plutôt que de créer une issue publique. 