// Utilitaires pour gérer les filtres multiples

export function isValueInFilter<T extends number | string>(
  filterValue: T | T[] | null,
  testValue: T
): boolean {
  if (!filterValue) return false
  
  if (Array.isArray(filterValue)) {
    return filterValue.includes(testValue)
  }
  
  return filterValue === testValue
}

export function hasMultipleValues(
  filterValue: number | string | number[] | string[] | null
): boolean {
  return Array.isArray(filterValue) && filterValue.length > 1
}

export function getFilterDisplayValue(
  filterValue: number | string | number[] | string[] | null,
  monthNames?: string[]
): string {
  if (!filterValue) return ''
  
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return ''
    if (filterValue.length === 1) {
      const value = filterValue[0]
      if (monthNames && typeof value === 'number') {
        return monthNames[value - 1] || value.toString()
      }
      return value.toString()
    }
    
    // Plusieurs valeurs
    const displayValues = filterValue.map(value => {
      if (monthNames && typeof value === 'number') {
        return monthNames[value - 1] || value.toString()
      }
      return value.toString()
    })
    
    if (displayValues.length <= 3) {
      return displayValues.join(', ')
    } else {
      return `${displayValues.slice(0, 2).join(', ')} et ${displayValues.length - 2} autres`
    }
  }
  
  // Valeur unique
  if (monthNames && typeof filterValue === 'number') {
    return monthNames[filterValue - 1] || filterValue.toString()
  }
  
  return filterValue.toString()
} 