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

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [1.5, 50.2], // Centre approximatif de la CCPM
      zoom: 10,
      pitch: 0,
      bearing: 0
    })

    map.current.on('load', () => {
      setIsMapLoaded(true)
      loadCommunesData()
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
      const communesData = await loadCommunesGeoJSON()
      setCommunes(communesData)
      
      if (map.current && isMapLoaded) {
        addCommunesLayer(communesData)
        fitToBounds(communesData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des communes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ajout de la couche des communes
  const addCommunesLayer = (communesData: any) => {
    if (!map.current) return

    // Source des données
    map.current.addSource('communes', {
      type: 'geojson',
      data: communesData
    })

    // Couche de remplissage
    map.current.addLayer({
      id: 'communes-fill',
      type: 'fill',
      source: 'communes',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'Insee'], selectedCommune || ''],
          '#3B82F6', // Bleu pour la commune sélectionnée
          '#10B981'  // Vert pour les autres
        ],
        'fill-opacity': [
          'case',
          ['==', ['get', 'Insee'], selectedCommune || ''],
          0.8,
          0.3
        ]
      }
    })

    // Couche de contour
    map.current.addLayer({
      id: 'communes-line',
      type: 'line',
      source: 'communes',
      paint: {
        'line-color': '#FFFFFF',
        'line-width': [
          'case',
          ['==', ['get', 'Insee'], selectedCommune || ''],
          3,
          1
        ],
        'line-opacity': 0.8
      }
    })

    // Gestion des clics
    map.current.on('click', 'communes-fill', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0] as any
        const insee = feature.properties?.Insee
        
        if (insee) {
          setSelectedCommune(insee)
          
          // Zoom sur la commune
          const bounds = new mapboxgl.LngLatBounds()
          const coords = feature.geometry.coordinates[0]
          coords.forEach((coord: [number, number]) => {
            bounds.extend(coord)
          })
          
          map.current?.fitBounds(bounds, { padding: 50 })
        }
      }
    })

    // Curseur pointer sur les communes
    map.current.on('mouseenter', 'communes-fill', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer'
      }
    })

    map.current.on('mouseleave', 'communes-fill', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = ''
      }
    })
  }

  // Ajustement aux limites des communes
  const fitToBounds = (communesData: any) => {
    if (!map.current) return
    
    const bounds = getBounds(communesData)
    if (bounds) {
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }

  // Mise à jour du style de carte
  useEffect(() => {
    if (map.current && isMapLoaded) {
      map.current.setStyle(`mapbox://styles/mapbox/${mapStyle}`)
      
      // Recréer les couches après changement de style
      map.current.once('styledata', () => {
        if (communes) {
          addCommunesLayer(communes)
        }
      })
    }
  }, [mapStyle, isMapLoaded])

  // Mise à jour de la commune sélectionnée
  useEffect(() => {
    if (map.current && map.current.getSource('communes')) {
      map.current.setPaintProperty('communes-fill', 'fill-color', [
        'case',
        ['==', ['get', 'Insee'], selectedCommune || ''],
        '#3B82F6',
        '#10B981'
      ])
      
      map.current.setPaintProperty('communes-fill', 'fill-opacity', [
        'case',
        ['==', ['get', 'Insee'], selectedCommune || ''],
        0.8,
        0.3
      ])
      
      map.current.setPaintProperty('communes-line', 'line-width', [
        'case',
        ['==', ['get', 'Insee'], selectedCommune || ''],
        3,
        1
      ])
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