'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getCommunesNames } from '../utils/geojsonLoader'
import { 
  loadSyntheseInsee,
  loadPhenoMoisInsee,
  loadTaxonomie,
  loadListesRouges,
  loadStatuts
} from '../utils/csvLoader'
import { joinCommuneData, joinSpeciesData, enrichCommuneDataWithNames } from '../utils/dataJoiner'
import { formatNumber } from '../utils/formatters'
import ToggleSwitch from './ToggleSwitch'
import type { SyntheseInsee, PhenoMoisInsee, Taxonomie, ListeRouge, Statut } from '../types'

const MAPBOX_STYLES = {
  'satellite-streets-v12': 'Satellite + Routes',
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
    showCommunes,
    mapStyle,
    isLoading,
    setSelectedCommune,
    setShow3D,
    setShowCommunes,
    setMapStyle,
    setCommuneData,
    setSpeciesData,
    setShowStatsPanel,
    setStatsPanelCommune
  } = useAppStore()

  const [dataLoaded, setDataLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Chargement des données CSV au montage
  useEffect(() => {
    if (!dataLoaded) {
      loadAllData()
    }
  }, [dataLoaded])

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
      let communeDataMap = joinCommuneData(syntheseData, phenoData)
      const speciesDataMap = joinSpeciesData(
        syntheseData,
        taxonomieData,
        listesRougesData,
        statutsData
      )

      // Enrichir avec les noms des communes si disponibles
      if (communes) {
        communeDataMap = enrichCommuneDataWithNames(communeDataMap, communes)
      }

      setCommuneData(communeDataMap)
      setSpeciesData(speciesDataMap)
      setDataLoaded(true)

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const communeNames = communes ? getCommunesNames(communes) : []
  
  // Filtrage des communes selon le terme de recherche
  const filteredCommuneNames = communeNames.filter(nom =>
    nom.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const selectedCommuneData = communeData && selectedCommune 
    ? communeData.get(selectedCommune) 
    : null

  const handleCommuneClick = (insee: string) => {
    setSelectedCommune(insee)
  }

  const handleFicheClick = (insee: string, e: React.MouseEvent) => {
    e.stopPropagation() // Empêche de déclencher le clic sur la commune
    // Rediriger vers la page détaillée de la commune
    window.location.href = `/commune/${insee}`
  }

  return (
    <aside className="w-80 p-4 flex flex-col h-full space-y-4">
      
      {/* Section Communes CCPM */}
      <div className="glass rounded-2xl p-6 flex-1 flex flex-col">
        {/* Titre */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-shadow">
          🏘️ Communes CCPM
        </h3>

        {/* Fiche commune sélectionnée */}
        {selectedCommuneData && (
          <div className="commune-card mb-6 animate-slide-up">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {selectedCommuneData.nom || `INSEE ${selectedCommuneData.insee}`}
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
              onClick={() => handleFicheClick(selectedCommune!, new MouseEvent('click') as any)}
            >
              Voir la fiche complète
            </button>
          </div>
        )}

        {/* Champ de recherche */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom de la commune"
            className="w-full p-2 text-sm rounded-lg bg-white/30 border border-white/50 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/50 transition-all"
          />
          {searchTerm && (
            <div className="text-xs text-gray-600 mt-1">
              {filteredCommuneNames.length} commune(s) trouvée(s)
            </div>
          )}
        </div>

        {/* Liste des communes */}
        <div className="flex-1 min-h-0">
          <h4 className="font-medium text-gray-700 mb-3">
            Liste des communes ({filteredCommuneNames.length})
          </h4>
          
          <div className="space-y-1 overflow-y-auto max-h-60">
            {isLoading || !dataLoaded ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-white/30 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              filteredCommuneNames.map((nom) => {
                const commune = communes?.features.find(f => f.properties.nom === nom)
                const insee = commune?.properties.insee
                const isSelected = insee === selectedCommune
                const data = communeData?.get(insee || '')
                
                return (
                  <div
                    key={insee}
                    className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
                      isSelected 
                        ? 'bg-blue-500/30 border border-blue-400/50 text-blue-800' 
                        : 'bg-white/20 hover:bg-white/30 text-gray-700'
                    }`}
                  >
                    {/* Icône de fiche */}
                    <button
                      onClick={(e) => handleFicheClick(insee || '', e)}
                      className="mr-2 p-1 rounded hover:bg-white/20 transition-colors"
                      title="Voir la fiche détaillée"
                    >
                      📊
                    </button>

                    {/* Nom de la commune cliquable */}
                    <button
                      onClick={() => handleCommuneClick(insee || '')}
                      className="flex-1 text-left flex justify-between items-center"
                    >
                      <span className="font-medium text-sm">{nom}</span>
                      {data && (
                        <span className="text-xs text-gray-600">
                          {formatNumber(data.totalObs)}
                        </span>
                      )}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Section Carte */}
      <div className="glass rounded-2xl p-6">
        {/* Titre */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-shadow text-center">
          🗺️ Carte
        </h3>
        
        <div className="space-y-3">
          {/* Toggle Communes */}
          <ToggleSwitch
            checked={showCommunes}
            onChange={setShowCommunes}
            label="Communes"
          />

          {/* Toggle 3D */}
          <ToggleSwitch
            checked={show3D}
            onChange={setShow3D}
            label="Bâtiments 3D"
          />

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
        </div>
      </div>
    </aside>
  )
} 