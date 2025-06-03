import Papa from 'papaparse'

export async function loadCSV<T>(filePath: string): Promise<T[]> {
  try {
    console.log(`Chargement de ${filePath}...`)
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement de ${filePath}: ${response.statusText}`)
    }
    
    const csvText = await response.text()
    console.log(`Fichier chargé: ${csvText.length} caractères`)
    
    return new Promise((resolve, reject) => {
      Papa.parse<T>(csvText, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('Erreurs de parsing CSV:', results.errors)
          }
          console.log(`${filePath} parsé: ${results.data.length} lignes`)
          if (results.data.length > 0) {
            console.log('Premier élément:', results.data[0])
          }
          resolve(results.data)
        },
        error: (error: Error) => reject(error)
      })
    })
  } catch (error) {
    console.error(`Erreur lors du chargement de ${filePath}:`, error)
    throw error
  }
}

// Fonctions spécialisées pour chaque type de données
export async function loadSyntheseInsee() {
  return loadCSV('/assets/data/synthese_insee.csv')
}

export async function loadPhenoMoisInsee() {
  return loadCSV('/assets/data/pheno_mois_insee.csv')
}

export async function loadTaxonomie() {
  return loadCSV('/assets/data/taxonomie.csv')
}

export async function loadListesRouges() {
  return loadCSV('/assets/data/lists_rouges.csv')
}

export async function loadStatuts() {
  return loadCSV('/assets/data/statuts.csv')
} 