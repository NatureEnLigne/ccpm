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
    showCommunes,
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
      center: [2.5, 46.8], // Centre sur la France
      zoom: 5, // Vue France entière
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

    // Couche de contour - vert foncé de la rampe pour toutes les communes
    map.current.addLayer({
      id: 'communes-line',
      type: 'line',
      source: 'communes',
      layout: {
        'visibility': showCommunes ? 'visible' : 'none'
      },
      paint: {
        'line-color': '#2d5016', // Vert le plus foncé de la rampe
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 1,    // Ligne très fine au zoom faible
          15, 2    // Ligne plus visible au zoom élevé
        ],
        'line-opacity': 0.8
      }
    })
    console.log('✅ Couche line ajoutée avec contour vert foncé #2d5016')

    // Couche de contour pour la sélection - au-dessus
    map.current.addLayer({
      id: 'communes-line-selected',
      type: 'line',
      source: 'communes',
      filter: ['==', ['get', 'insee'], ''], // Initialement vide
      layout: {
        'visibility': showCommunes ? 'visible' : 'none'
      },
      paint: {
        'line-color': '#cd853f', // Doré marron le plus clair de la rampe pour la commune sélectionnée
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 2,    // Ligne plus fine au zoom faible
          15, 4    // Ligne plus épaisse au zoom élevé
        ],
        'line-opacity': 1.0
      }
    })
    console.log('✅ Couche line sélection ajoutée avec couleur doré marron #cd853f')

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

  // Effet pour zoomer sur commune sélectionnée depuis la sidebar ou revenir à l'emprise globale
  useEffect(() => {
    if (selectedCommune && communes && map.current && isMapLoaded) {
      const feature = communes.features.find(f => f.properties.insee === selectedCommune)
      if (feature) {
        zoomToCommune(feature)
      }
    } else if (!selectedCommune && communes && map.current && isMapLoaded) {
      // Retour à l'emprise globale quand on désélectionne une commune
      const bounds = getBounds(communes)
      if (bounds) {
        console.log('🎯 Retour à l\'emprise globale CCPM...')
        map.current.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 11,
          duration: 1000 // Animation plus rapide pour le retour
        })
      }
    }
  }, [selectedCommune, communes, isMapLoaded])

  // Ajustement aux limites des communes CCPM
  const fitToBounds = (communesData: any) => {
    if (!map.current) return
    
    const bounds = getBounds(communesData)
    if (bounds) {
      // Délai avant de zoomer pour permettre à l'utilisateur de voir la vue France
      setTimeout(() => {
        console.log('🎯 Zoom automatique vers la zone CCPM...')
        map.current?.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 11, // Limiter le zoom pour voir toute l'emprise
          duration: 2000, // Animation de 2 secondes
          essential: true // Animation non interruptible
        })
      }, 1500) // Attendre 1.5 secondes avant de zoomer
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

  // Gestion de la visibilité des communes
  useEffect(() => {
    if (map.current && map.current.getLayer('communes-line')) {
      const visibility = showCommunes ? 'visible' : 'none'
      map.current.setLayoutProperty('communes-line', 'visibility', visibility)
      map.current.setLayoutProperty('communes-line-selected', 'visibility', visibility)
    }
  }, [showCommunes])

  // Gestion de la 3D
  useEffect(() => {
    if (map.current && isMapLoaded) {
      // Supprimer la couche existante si elle existe
      if (map.current.getLayer('building-3d')) {
        map.current.removeLayer('building-3d')
      }
      
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
        console.log('🏢 Couche bâtiments 3D ajoutée')
      } else {
        console.log('🏢 Couche bâtiments 3D supprimée')
      }
    }
  }, [show3D, isMapLoaded])

  // Initialiser les bâtiments 3D au chargement de la carte si show3D est true
  useEffect(() => {
    if (isMapLoaded && show3D && map.current && !map.current.getLayer('building-3d')) {
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
      console.log('🏢 Couche bâtiments 3D initialisée au chargement')
    }
  }, [isMapLoaded])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
      
      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-amber-600 mx-auto mb-6"></div>
            <p className="data-label-unified font-bold text-lg">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  )
} 