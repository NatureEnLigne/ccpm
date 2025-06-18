'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '../store/useAppStore'
import { loadCommunesGeoJSON, getBounds } from '../utils/geojsonLoader'

// Fix pour les icônes Leaflet par défaut
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const TILE_LAYERS = {
  'streets': {
    name: 'Rues',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  'satellite': {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  'terrain': {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  },
  'light': {
    name: 'Clair',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
}

// Composant pour gérer les interactions avec la carte
function MapController() {
  const map = useMap()
  const {
    communes,
    selectedCommune,
    showCommunes,
    setSelectedCommune,
    setCommunes,
    setLoading
  } = useAppStore()

  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Chargement initial des données
  useEffect(() => {
    if (!isMapLoaded) {
      setIsMapLoaded(true)
      loadCommunesData()
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
      
      // Zoom sur l'emprise des communes après un délai
      setTimeout(() => {
        fitToBounds(communesData)
      }, 1500)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des communes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ajustement aux limites des communes CCPM
  const fitToBounds = (communesData: any) => {
    const bounds = getBounds(communesData)
    if (bounds && map) {
      console.log('🎯 Zoom automatique vers la zone CCPM...')
      
      // Convertir les bounds [[lng, lat], [lng, lat]] vers Leaflet [[lat, lng], [lat, lng]]
      const leafletBounds = L.latLngBounds(
        [bounds[0][1], bounds[0][0]], // sud-ouest [lat, lng]
        [bounds[1][1], bounds[1][0]]  // nord-est [lat, lng]
      )
      
      setTimeout(() => {
        map.fitBounds(leafletBounds, { 
          padding: [50, 50],
          maxZoom: 11
        })
      }, 500)
    }
  }

  // Zoom sur une commune spécifique
  const zoomToCommune = (feature: any) => {
    if (!map) return
    
    const layer = L.geoJSON(feature)
    const bounds = layer.getBounds()
    
    map.fitBounds(bounds, { 
      padding: [100, 100],
      maxZoom: 14
    })
  }

  // Effet pour zoomer sur commune sélectionnée
  useEffect(() => {
    if (selectedCommune && communes && map) {
      const feature = communes.features.find(f => f.properties.insee === selectedCommune)
      if (feature) {
        zoomToCommune(feature)
      }
    } else if (!selectedCommune && communes && map) {
      // Retour à l'emprise globale
      const bounds = getBounds(communes)
      if (bounds) {
        console.log('🎯 Retour à l\'emprise globale CCPM...')
        const leafletBounds = L.latLngBounds(
          [bounds[0][1], bounds[0][0]],
          [bounds[1][1], bounds[1][0]]
        )
        map.fitBounds(leafletBounds, { 
          padding: [50, 50],
          maxZoom: 11
        })
      }
    }
  }, [selectedCommune, communes, map])

  return null
}

export default function LeafletMap() {
  const {
    communes,
    showCommunes,
    mapStyle,
    selectedCommune
  } = useAppStore()

  const [isMapReady, setIsMapReady] = useState(false)

  // Configuration de la couche de tuiles actuelle
  const currentTileLayer = TILE_LAYERS[mapStyle as keyof typeof TILE_LAYERS] || TILE_LAYERS.streets

  return (
    <MapContainer
      center={[46.8, 2.5]} // Centre sur la France
      zoom={5}
      className="w-full h-full rounded-2xl overflow-hidden"
      whenReady={() => {
        console.log('🗺️ Carte Leaflet prête')
        setIsMapReady(true)
      }}
    >
      {/* Couche de tuiles */}
      <TileLayer
        url={currentTileLayer.url}
        attribution={currentTileLayer.attribution}
      />
      
      {/* Couche des communes */}
      {communes && showCommunes && (
        <GeoJSON
          key={`communes-${showCommunes}-${selectedCommune}`}
          data={communes}
          style={(feature) => {
            const isSelected = feature?.properties?.insee === selectedCommune
            return {
              fillColor: 'transparent',
              weight: isSelected ? 4 : 2,
              opacity: 0.8,
              color: isSelected ? '#cd853f' : '#2d5016',
              dashArray: '',
              fillOpacity: 0
            }
          }}
          onEachFeature={(feature, layer) => {
            layer.on({
              mouseover: () => {
                const pathLayer = layer as L.Path
                pathLayer.setStyle({ weight: 4, color: '#cd853f' })
              },
              mouseout: () => {
                const pathLayer = layer as L.Path
                const isSelected = feature.properties?.insee === selectedCommune
                pathLayer.setStyle({ 
                  weight: isSelected ? 4 : 2, 
                  color: isSelected ? '#cd853f' : '#2d5016'
                })
              },
              click: () => {
                console.log('🖱️ Clic sur commune:', feature.properties)
                const insee = feature.properties?.insee
                if (insee) {
                  useAppStore.getState().setSelectedCommune(insee)
                }
              }
            })
          }}
        />
      )}
      
      {/* Contrôleur de la carte */}
      {isMapReady && <MapController />}
    </MapContainer>
  )
} 