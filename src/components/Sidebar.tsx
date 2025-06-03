'use client'

import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getCommunesNames } from '../utils/geojsonLoader'
import { 
  loadSyntheseInsee,
  loadPhenoMoisInsee,
  loadTaxonomie,
  loadListesRouges,
  loadStatuts
} from '../utils/csvLoader'
import { joinCommuneData, joinSpeciesData } from '../utils/dataJoiner'
import { formatNumber } from '../utils/formatters'
import type { SyntheseInsee, PhenoMoisInsee, Taxonomie, ListeRouge, Statut } from '../types'

const MAPBOX_STYLES = {
  'satellite-v9': 'Satellite',
  'outdoors-v12': 'Terrain',
  'streets-v12': 'Rues',
  'light-v11': 'Clair'
}

export default function Sidebar() {
  const {
    communes,
    communeData,
    selectedCommune,
    show3D,
    mapStyle,
    isLoading,
    setSelectedCommune,
    setShow3D,
    setMapStyle,
    setCommuneData,
    setSpeciesData
  } = useAppStore()

  // Chargement des données CSV au montage
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      console.log('Chargement des données CSV...')
      
      const [
        syntheseData,
        phenoData,
        taxonomieData,
        listesRougesData,
        statutsData
      ] = await Promise.all([
        loadSyntheseInsee() as Promise<SyntheseInsee[]>,
        loadPhenoMoisInsee() as Promise<PhenoMoisInsee[]>,
        loadTaxonomie() as Promise<Taxonomie[]>,
        loadListesRouges() as Promise<ListeRouge[]>,
        loadStatuts() as Promise<Statut[]>
      ])

      console.log('Données chargées:', {
        synthese: syntheseData.length,
        pheno: phenoData.length,
        taxonomie: taxonomieData.length,
        listesRouges: listesRougesData.length,
        statuts: statutsData.length
      })

      // Joindre les données
      const communeDataMap = joinCommuneData(syntheseData, phenoData)
      const speciesDataMap = joinSpeciesData(
        syntheseData,
        taxonomieData,
        listesRougesData,
        statutsData
      )

      setCommuneData(communeDataMap)
      setSpeciesData(speciesDataMap)

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const communeNames = communes ? getCommunesNames(communes) : []
  const selectedCommuneData = communeData && selectedCommune 
    ? communeData.get(selectedCommune) 
    : null

  return (
    <aside className="w-80 p-4 flex flex-col h-full">
      <div className="glass rounded-2xl p-6 flex-1 flex flex-col">
        
        {/* Titre */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-shadow">
          🏘️ Communes CCPM
        </h3>

        {/* Fiche commune sélectionnée */}
        {selectedCommuneData && (
          <div className="commune-card mb-6 animate-slide-up">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {selectedCommuneData.nom}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Code INSEE:</span>
                <span className="font-medium">{selectedCommuneData.insee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Observations:</span>
                <span className="font-medium text-blue-600">
                  {formatNumber(selectedCommuneData.totalObs)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Espèces:</span>
                <span className="font-medium text-green-600">
                  {formatNumber(selectedCommuneData.totalEsp)}
                </span>
              </div>
            </div>
            
            <button 
              className="w-full mt-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors border border-blue-300/50"
              onClick={() => {
                // TODO: Navigation vers la page détaillée
                console.log('Navigation vers', selectedCommune)
              }}
            >
              Voir la fiche complète
            </button>
          </div>
        )}

        {/* Liste des communes */}
        <div className="flex-1 min-h-0">
          <h4 className="font-medium text-gray-700 mb-3">
            Liste des communes ({communeNames.length})
          </h4>
          
          <div className="space-y-1 overflow-y-auto max-h-60">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-white/30 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              communeNames.map((nom) => {
                const commune = communes?.features.find(f => f.properties.Nom === nom)
                const insee = commune?.properties.Insee
                const isSelected = insee === selectedCommune
                const data = communeData?.get(insee || '')
                
                return (
                  <button
                    key={insee}
                    onClick={() => setSelectedCommune(insee || null)}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${
                      isSelected 
                        ? 'bg-blue-500/30 border border-blue-400/50 text-blue-800' 
                        : 'bg-white/20 hover:bg-white/30 text-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{nom}</span>
                      {data && (
                        <span className="text-xs text-gray-600">
                          {formatNumber(data.totalObs)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Contrôles */}
        <div className="mt-6 space-y-4 border-t border-white/20 pt-4">
          
          {/* Toggle 3D */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={show3D}
                onChange={(e) => setShow3D(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Afficher bâtiments 3D
              </span>
            </label>
          </div>

          {/* Sélecteur de style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fond de carte
            </label>
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="w-full p-2 text-sm rounded-lg bg-white/30 border border-white/50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {Object.entries(MAPBOX_STYLES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Statistiques globales */}
          {communeData && (
            <div className="bg-white/20 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                📊 Statistiques CCPM
              </h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total observations:</span>
                  <span className="font-medium">
                    {formatNumber(
                      Array.from(communeData.values())
                        .reduce((sum, c) => sum + c.totalObs, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total espèces:</span>
                  <span className="font-medium">
                    {formatNumber(
                      Array.from(communeData.values())
                        .reduce((sum, c) => sum + c.totalEsp, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
} 