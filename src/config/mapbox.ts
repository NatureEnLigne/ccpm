export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  styles: {
    'satellite-streets-v12': 'Satellite + Routes',
    'satellite-v9': 'Satellite',
    'outdoors-v12': 'Terrain',
    'streets-v12': 'Rues', 
    'light-v11': 'Clair'
  }
}

// Debug pour vérifier le token
if (typeof window !== 'undefined') {
  console.log('🔑 Configuration Mapbox côté client:', {
    hasToken: !!MAPBOX_CONFIG.accessToken,
    tokenLength: MAPBOX_CONFIG.accessToken.length,
    tokenStart: MAPBOX_CONFIG.accessToken.substring(0, 10)
  })
} 