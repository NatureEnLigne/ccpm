import type { CommuneCollection } from '../types'
import { promises as fs } from 'fs'
import path from 'path'

export async function loadCommunesGeoJSON(): Promise<CommuneCollection> {
  try {
    // Déterminer si on est côté serveur ou client
    const isServer = typeof window === 'undefined'
    
    if (isServer) {
      // Côté serveur : lire le fichier directement depuis le système de fichiers
      const filePath = path.join(process.cwd(), 'public', 'assets', 'data', 'ccpm.geojson')
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const geojson: CommuneCollection = JSON.parse(fileContent)
      
      console.log(`GeoJSON chargé (serveur): ${geojson.features.length} communes`)
      return geojson
    } else {
      // Côté client : utiliser fetch
      const response = await fetch('/assets/data/ccpm.geojson')
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement du GeoJSON: ${response.statusText}`)
      }
      
      const geojson: CommuneCollection = await response.json()
      
      // Validation basique du format GeoJSON
      if (!geojson.type || geojson.type !== 'FeatureCollection') {
        throw new Error('Format GeoJSON invalide: type FeatureCollection attendu')
      }
      
      if (!Array.isArray(geojson.features)) {
        throw new Error('Format GeoJSON invalide: features doit être un tableau')
      }
      
      console.log(`GeoJSON chargé (client): ${geojson.features.length} communes`)
      return geojson
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement du GeoJSON:', error)
    throw error
  }
}

export function getCommuneByInsee(communes: CommuneCollection, insee: string) {
  return communes.features.find(
    feature => feature.properties.insee === insee
  )
}

export function getCommunesNames(communes: CommuneCollection): string[] {
  return communes.features
    .map(feature => feature.properties.nom)
    .sort()
}

export function getBounds(communes: CommuneCollection): [[number, number], [number, number]] | null {
  if (!communes.features.length) return null
  
  let minLng = Infinity, minLat = Infinity
  let maxLng = -Infinity, maxLat = -Infinity
  
  communes.features.forEach(feature => {
    const coords = feature.geometry.coordinates
    const flatCoords = flattenCoordinates(coords)
    
    flatCoords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng)
      minLat = Math.min(minLat, lat)
      maxLng = Math.max(maxLng, lng)
      maxLat = Math.max(maxLat, lat)
    })
  })
  
  return [[minLng, minLat], [maxLng, maxLat]]
}

function flattenCoordinates(coords: any): number[][] {
  const result: number[][] = []
  
  function flatten(arr: any) {
    if (Array.isArray(arr) && arr.length === 2 && typeof arr[0] === 'number') {
      result.push(arr as number[])
    } else if (Array.isArray(arr)) {
      arr.forEach(flatten)
    }
  }
  
  flatten(coords)
  return result
} 