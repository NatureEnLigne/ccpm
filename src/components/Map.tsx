'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { useAppStore } from '../store/useAppStore'
import { loadCommunesGeoJSON, getBounds } from '../utils/geojsonLoader'
import type { CommuneFeature } from '../types'

// Configuration Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

const MAPBOX_STYLES = {
  'satellite-v9': 'Satellite',
  'outdoors-v12': 'Terrain',
  'streets-v12': 'Rues',
  'light-v11': 'Clair'
}

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  
  const {
    communes,
    selectedCommune,
    show3D,
    mapStyle,
    setCommunes,
    setSelectedCommune,
    setLoading
  } = useAppStore()

  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Initialisation de la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('🗺️ Initialisation de la carte...')

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [1.8, 50.25], // Centre sur la CCPM
      zoom: 9, // Zoom réduit pour voir toute l'emprise
      pitch: 0,
      bearing: 0
    })

    map.current.on('load', () => {
      console.log('🗺️ Carte chargée, démarrage du chargement des données...')
      setIsMapLoaded(true)
      // Force le chargement immédiat des données
      setTimeout(() => {
        loadCommunesData()
      }, 500) // Délai pour s'assurer que la carte est prête
    })

    map.current.on('error', (e) => {
      console.error('❌ Erreur Mapbox:', e)
    })

    // Nettoyage
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Chargement des données GeoJSON
  const loadCommunesData = async () => {
    try {
      setLoading(true)
      console.log('🗺️ Début du chargement des communes...')
      
      const communesData = await loadCommunesGeoJSON()
      console.log('🗺️ Communes chargées:', communesData)
      console.log('🗺️ Nombre de communes:', communesData.features.length)
      
      setCommunes(communesData)
      
      // Force l'ajout des couches même si isMapLoaded n'est pas encore true
      if (map.current) {
        console.log('🗺️ Ajout forcé des couches à la carte...')
        addCommunesLayer(communesData)
        fitToBounds(communesData)
        console.log('🗺️ Couches ajoutées avec succès')
      } else {
        console.log('❌ map.current n\'est pas disponible')
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des communes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ajout de la couche des communes
  const addCommunesLayer = (communesData: any) => {
    if (!map.current) {
      console.log('❌ Map non disponible')
      return
    }

    console.log('🎨 Ajout de la source communes...')
    
    // Supprimer la source existante si elle existe
    if (map.current.getSource('communes')) {
      console.log('🗑️ Suppression de l\'ancienne source communes')
      if (map.current.getLayer('communes-line')) {
        map.current.removeLayer('communes-line')
      }
      if (map.current.getLayer('communes-line-selected')) {
        map.current.removeLayer('communes-line-selected')
      }
      map.current.removeSource('communes')
    }

    // Source des données
    map.current.addSource('communes', {
      type: 'geojson',
      data: communesData
    })
    console.log('✅ Source communes ajoutée')

    // Couche de contour - vert pour toutes les communes
    map.current.addLayer({
      id: 'communes-line',
      type: 'line',
      source: 'communes',
      paint: {
        'line-color': '#8ac926', // Vert pour toutes les communes
        'line-width': 2,
        'line-opacity': 1.0
      }
    })
    console.log('✅ Couche line ajoutée avec contours VERTS')

    // Couche de contour pour la sélection - au-dessus
    map.current.addLayer({
      id: 'communes-line-selected',
      type: 'line',
      source: 'communes',
      filter: ['==', ['get', 'insee'], ''], // Initialement vide
      paint: {
        'line-color': '#FF8C00', // Orange pour la sélection
        'line-width': 3,
        'line-opacity': 1.0
      }
    })
    console.log('✅ Couche line sélection ajoutée avec contours ORANGE')

    // Gestion des clics
    map.current.on('click', 'communes-line', (e) => {
      console.log('🖱️ Clic sur commune:', e.features?.[0]?.properties)
      if (e.features && e.features[0]) {
        const feature = e.features[0] as any
        const insee = feature.properties?.insee
        
        if (insee) {
          setSelectedCommune(insee)
          zoomToCommune(feature)
        }
      }
    })

    // Curseur pointer sur les communes
    map.current.on('mouseenter', 'communes-line', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer'
      }
    })

    map.current.on('mouseleave', 'communes-line', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = ''
      }
    })
    
    console.log('🎮 Événements ajoutés')
  }

  // Fonction pour zoomer sur une commune
  const zoomToCommune = (feature: any) => {
    if (!map.current) return
    
    const bounds = new mapboxgl.LngLatBounds()
    
    // Gérer les géométries Polygon et MultiPolygon
    const coords = feature.geometry.type === 'MultiPolygon' 
      ? feature.geometry.coordinates[0][0] 
      : feature.geometry.coordinates[0]
    
    coords.forEach((coord: [number, number]) => {
      bounds.extend(coord)
    })
    
    map.current.fitBounds(bounds, { 
      padding: 100,
      maxZoom: 14
    })
  }

  // Effet pour zoomer sur commune sélectionnée depuis la sidebar
  useEffect(() => {
    if (selectedCommune && communes && map.current && isMapLoaded) {
      const feature = communes.features.find(f => f.properties.insee === selectedCommune)
      if (feature) {
        zoomToCommune(feature)
      }
    }
  }, [selectedCommune, communes, isMapLoaded])

  // Ajustement aux limites des communes CCPM
  const fitToBounds = (communesData: any) => {
    if (!map.current) return
    
    const bounds = getBounds(communesData)
    if (bounds) {
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 11 // Limiter le zoom pour voir toute l'emprise
      })
    }
  }

  // Mise à jour du style de carte
  useEffect(() => {
    if (map.current && isMapLoaded) {
      map.current.setStyle(`mapbox://styles/mapbox/${mapStyle}`)
      
      // Recréer les couches après changement de style
      map.current.once('styledata', () => {
        if (communes) {
          // Attendre que le style soit complètement chargé
          setTimeout(() => {
            addCommunesLayer(communes)
          }, 100)
        }
      })
    }
  }, [mapStyle, isMapLoaded])

  // Mise à jour de la commune sélectionnée
  useEffect(() => {
    if (map.current && map.current.getSource('communes')) {
      // Mise à jour du filtre pour la couche de sélection
      if (selectedCommune) {
        map.current.setFilter('communes-line-selected', ['==', ['get', 'insee'], selectedCommune])
      } else {
        map.current.setFilter('communes-line-selected', ['==', ['get', 'insee'], ''])
      }
    }
  }, [selectedCommune])

  // Gestion de la 3D
  useEffect(() => {
    if (map.current && isMapLoaded) {
      if (show3D) {
        map.current.addLayer({
          id: 'building-3d',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              15.05, ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              15.05, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        })
      } else {
        if (map.current.getLayer('building-3d')) {
          map.current.removeLayer('building-3d')
        }
      }
    }
  }, [show3D, isMapLoaded])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
      
      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 glass rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  )
} 