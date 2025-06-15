// Palette de couleurs cohérente basée sur la gamme de verts
export const GREEN_PALETTE = {
  // Verts principaux de la palette
  primary: '#2d5016',      // Vert foncé principal
  secondary: '#4a7c59',    // Vert mousse
  tertiary: '#6b8e23',     // Vert olive
  quaternary: '#8fbc8f',   // Vert gris clair
  light: '#9acd32',        // Vert jaune
  accent: '#228b22',       // Vert forêt
  
  // Nuances pour les dégradés
  shades: [
    '#1a3d0f',  // Vert très foncé
    '#2d5016',  // Vert foncé principal
    '#3f6b1f',  // Vert foncé moyen
    '#4a7c59',  // Vert mousse
    '#5a8a3a',  // Vert moyen
    '#6b8e23',  // Vert olive
    '#7ba428',  // Vert olive clair
    '#8fbc8f',  // Vert gris clair
    '#9acd32',  // Vert jaune
    '#a8d468',  // Vert clair
    '#b8e6b8',  // Vert très clair
    '#c8f0c8'   // Vert pastel
  ]
}

// Fonction pour générer une rampe de couleurs cohérente
export const generateGreenColorRamp = (count: number): string[] => {
  if (count === 0) return []
  if (count === 1) return [GREEN_PALETTE.primary]
  
  const colors: string[] = []
  const totalShades = GREEN_PALETTE.shades.length
  
  // Si on a moins de couleurs que de nuances disponibles, on prend des couleurs espacées
  if (count <= totalShades) {
    const step = Math.floor(totalShades / count)
    for (let i = 0; i < count; i++) {
      const index = Math.min(i * step, totalShades - 1)
      colors.push(GREEN_PALETTE.shades[index])
    }
  } else {
    // Si on a plus de couleurs que de nuances, on interpole
    for (let i = 0; i < count; i++) {
      const ratio = i / (count - 1)
      const shadeIndex = ratio * (totalShades - 1)
      const lowerIndex = Math.floor(shadeIndex)
      const upperIndex = Math.ceil(shadeIndex)
      
      if (lowerIndex === upperIndex) {
        colors.push(GREEN_PALETTE.shades[lowerIndex])
      } else {
        // Interpolation entre deux couleurs
        const lowerColor = hexToRgb(GREEN_PALETTE.shades[lowerIndex])
        const upperColor = hexToRgb(GREEN_PALETTE.shades[upperIndex])
        const t = shadeIndex - lowerIndex
        
        const r = Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * t)
        const g = Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * t)
        const b = Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * t)
        
        colors.push(`rgb(${r}, ${g}, ${b})`)
      }
    }
  }
  
  return colors
}

// Fonction utilitaire pour convertir hex en RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

// Couleurs spécifiques pour différents types de données
export const CHART_COLORS = {
  // Pour les graphiques en barres (listes rouges, etc.)
  bar: GREEN_PALETTE.primary,
  
  // Pour les graphiques en ligne (phénologie)
  line: GREEN_PALETTE.secondary,
  
  // Pour les bulles
  bubble: GREEN_PALETTE.tertiary,
  
  // Pour les éléments d'interface
  ui: {
    background: GREEN_PALETTE.light,
    text: GREEN_PALETTE.primary,
    border: GREEN_PALETTE.secondary,
    hover: GREEN_PALETTE.accent
  }
} 