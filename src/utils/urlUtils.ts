/**
 * Génère un lien de partage avec les filtres actuels
 */
export function generateShareLink(codeInsee: string, filters: any): string {
  const baseUrl = window.location.origin
  const currentPath = `/commune/${codeInsee}`
  const searchParams = new URLSearchParams()

  // Noms des mois pour la conversion
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  // Ajouter tous les filtres actifs aux paramètres de l'URL
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && key !== 'activeFilters') {
      if (Array.isArray(value)) {
        // Conversion spéciale pour les mois (convertir noms en numéros)
        if (key === 'selectedMois') {
          const monthNumbers = value.map((monthName: string) => {
            const index = monthNames.indexOf(monthName)
            return index !== -1 ? (index + 1).toString() : monthName
          })
          searchParams.set(key, monthNumbers.join(','))
        } else {
          // Pour les autres filtres multiples, joindre par des virgules
          searchParams.set(key, value.join(','))
        }
      } else {
        // Conversion pour un seul mois
        if (key === 'selectedMois') {
          const index = monthNames.indexOf(value as string)
          const monthValue = index !== -1 ? (index + 1).toString() : value
          searchParams.set(key, String(monthValue))
        } else {
          searchParams.set(key, String(value))
        }
      }
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}${currentPath}?${queryString}` : `${baseUrl}${currentPath}`
}

/**
 * Applique les filtres depuis les paramètres URL
 */
export function applyFiltersFromURL(setFilter: (key: any, value: any, source: string) => void): void {
  const urlParams = new URLSearchParams(window.location.search)
  
  // Noms des mois pour la conversion
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  
  // Parcourir tous les paramètres URL et appliquer les filtres correspondants
  urlParams.forEach((value, key) => {
    if (value && key !== 'activeFilters') {
      let filterValue: any = value
      
      // Gérer les filtres multiples (séparés par des virgules)
      if (value.includes(',')) {
        filterValue = value.split(',')
        
        // Conversion spéciale pour les mois (convertir numéros en noms)
        if (key === 'selectedMois') {
          filterValue = filterValue.map((monthNum: string) => {
            const num = parseInt(monthNum.trim(), 10)
            return (num >= 1 && num <= 12) ? monthNames[num - 1] : monthNum
          })
        }
      }
      // Gérer les nombres
      else if (key === 'anneeDebut' || key === 'anneeFin') {
        filterValue = parseInt(value, 10)
        if (isNaN(filterValue)) return
      }
      // Conversion pour un seul mois
      else if (key === 'selectedMois') {
        const num = parseInt(value.trim(), 10)
        filterValue = (num >= 1 && num <= 12) ? monthNames[num - 1] : value
      }
      
      // Appliquer le filtre
      console.log(`🔧 Filtre appliqué depuis URL: ${key} =`, filterValue)
      setFilter(key as any, filterValue, 'URL')
    }
  })
} 