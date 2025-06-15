#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fonction pour traiter récursivement les fichiers
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      processFile(filePath);
    }
  });
}

// Fonction pour traiter un fichier
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Supprimer les console.log, console.warn, console.debug (mais garder console.error)
  const patterns = [
    /console\.log\([^)]*\);?\s*\n?/g,
    /console\.warn\([^)]*\);?\s*\n?/g,
    /console\.debug\([^)]*\);?\s*\n?/g
  ];
  
  patterns.forEach(pattern => {
    const newContent = content.replace(pattern, '');
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Logs supprimés dans: ${filePath}`);
  }
}

// Démarrer le traitement
console.log('🧹 Suppression des logs de débogage...');
processDirectory('./src');
console.log('✅ Nettoyage terminé !'); 