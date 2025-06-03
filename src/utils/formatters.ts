// Formatage des nombres
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// Formatage des pourcentages
export function formatPercent(value: number, total: number): string {
  const percent = (value / total) * 100
  return `${percent.toFixed(1)}%`
}

// Formatage des noms de mois
export function formatMonth(monthNumber: number): string {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ]
  return months[monthNumber - 1] || `Mois ${monthNumber}`
}

// Couleurs pour les groupes taxonomiques
export function getGroupColor(groupe: string): string {
  const colorMap: Record<string, string> = {
    'Oiseaux': '#3B82F6',
    'Mammifères': '#10B981',
    'Reptiles': '#F59E0B',
    'Amphibiens': '#8B5CF6',
    'Insectes': '#EF4444',
    'Arachnides': '#6B7280',
    'Mollusques': '#EC4899',
    'Crustacés': '#14B8A6',
    'Poissons': '#06B6D4',
    'Plantes': '#84CC16',
    'Champignons': '#A855F7',
    'Autres': '#6B7280'
  }
  
  return colorMap[groupe] || '#6B7280'
}

// Couleurs pour les statuts de conservation
export function getStatutColor(statut: string): string {
  const colorMap: Record<string, string> = {
    'Critique': '#DC2626',
    'En danger': '#EA580C',
    'Vulnérable': '#D97706',
    'Quasi menacé': '#CA8A04',
    'Préoccupation mineure': '#16A34A',
    'Données insuffisantes': '#6B7280',
    'Non applicable': '#94A3B8',
    'Non évalué': '#CBD5E1'
  }
  
  return colorMap[statut] || '#6B7280'
}

// Formatage pour les tooltips des graphiques
export function formatTooltip(value: number, label: string): string {
  return `${label}: ${formatNumber(value)}`
}

// Formatage des coordonnées géographiques
export function formatCoordinates(lng: number, lat: number): string {
  const formatCoord = (coord: number, isLat: boolean) => {
    const abs = Math.abs(coord)
    const deg = Math.floor(abs)
    const min = Math.floor((abs - deg) * 60)
    const sec = ((abs - deg) * 60 - min) * 60
    const direction = coord >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W')
    
    return `${deg}°${min}'${sec.toFixed(1)}"${direction}`
  }
  
  return `${formatCoord(lat, true)} ${formatCoord(lng, false)}`
}

// Truncate long text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Formatage des superficies
export function formatArea(area: number): string {
  if (area >= 1000000) {
    return `${(area / 1000000).toFixed(1)} km²`
  }
  return `${(area / 10000).toFixed(1)} ha`
} 