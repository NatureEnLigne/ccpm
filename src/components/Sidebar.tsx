'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { loadCommunesGeoJSON } from '../utils/geojsonLoader'
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
    selectedCommune,
    setSelectedCommune,
    communeData,
    setCommuneData,
    speciesData,
    setSpeciesData,
    mapStyle,
    setMapStyle,
    showCommunes,
    setShowCommunes,
    show3D,
    setShow3D
  } = useAppStore()

  const [communeNames, setCommuneNames] = useState<Map<string, string>>(new Map())
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Filtrer les communes selon le terme de recherche
  const filteredCommuneNames = Array.from(communeNames.entries())
    .filter(([codeInsee, name]) => 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codeInsee.includes(searchTerm)
    )
    .sort((a, b) => a[1].localeCompare(b[1]))

  // Charger les données au montage
  useEffect(() => {
    const loadAllData = async () => {
      try {
        console.log('🔄 Chargement des données...')
        setIsLoading(true)

        // Charger d'abord le GeoJSON pour obtenir les noms des communes
        const communesGeoJSON = await loadCommunesGeoJSON()
        
        // Créer une map des noms des communes (insee -> nom)
        const namesMap = new Map<string, string>()
        communesGeoJSON.features.forEach(feature => {
          namesMap.set(feature.properties.insee, feature.properties.nom)
        })
        setCommuneNames(namesMap)

        // Charger toutes les données en parallèle
        const [syntheseData, phenoData, taxonomieData, listesRougesData, statutsData] = await Promise.all([
          loadSyntheseInsee(),
          loadPhenoMoisInsee(),
          loadTaxonomie(),
          loadListesRouges(),
          loadStatuts()
        ])

        console.log('📊 Données chargées:', {
          synthese: syntheseData.length,
          pheno: phenoData.length,
          taxonomie: taxonomieData.length,
          listesRouges: listesRougesData.length,
          statuts: statutsData.length
        })

        // Joindre et enrichir les données
        const enrichedCommuneData = joinCommuneData(syntheseData as SyntheseInsee[], phenoData as PhenoMoisInsee[])
        const enrichedSpeciesData = joinSpeciesData(syntheseData as SyntheseInsee[], taxonomieData as Taxonomie[], listesRougesData as ListeRouge[], statutsData as Statut[])
        const finalCommuneData = enrichCommuneDataWithNames(enrichedCommuneData, communesGeoJSON)

        setCommuneData(finalCommuneData)
        setSpeciesData(enrichedSpeciesData)

        console.log('✅ Données enrichies et prêtes')
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [setCommuneData, setSpeciesData])

  return (
    <div className="w-96 flex flex-col gap-6">
      {/* Section Communes CCPM */}
      <div className="modern-card p-6 fade-in-scale">
        {/* Titre */}
        <h3 className="text-xl font-bold text-gradient mb-6 flex items-center gap-2">
          <span className="w-3 h-3 bg-gradient-primary rounded-full"></span>
          🏘️ Communes CCPM
        </h3>

        {/* Fiche commune sélectionnée */}
        {selectedCommune && communeData?.has(selectedCommune) && (
          <div className="mb-6 p-4 bg-gradient-primary rounded-2xl text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-lg">
                {communeNames.get(selectedCommune) || selectedCommune}
              </h4>
              <button
                onClick={() => setSelectedCommune(null)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                title="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <div className="font-bold text-xl">
                  {formatNumber(communeData.get(selectedCommune)?.totalObs || 0)}
                </div>
                <div className="opacity-90">Observations</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <div className="font-bold text-xl">
                  {formatNumber(communeData.get(selectedCommune)?.totalEsp || 0)}
                </div>
                <div className="opacity-90">Espèces</div>
              </div>
            </div>
          </div>
        )}

        {/* Champ de recherche moderne */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom de la commune"
              className="input-modern w-full pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
          {searchTerm && (
            <div className="mt-2">
              <span className="badge-modern text-xs">
                {filteredCommuneNames.length} commune(s) trouvée(s)
              </span>
            </div>
          )}
        </div>

        {/* Liste des communes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>Chargement des communes...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredCommuneNames.map(([codeInsee, name]) => {
              const commune = communeData?.get(codeInsee)
              const isSelected = selectedCommune === codeInsee
              
              return (
                <button
                  key={codeInsee}
                  onClick={() => setSelectedCommune(codeInsee)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                    isSelected 
                      ? 'bg-gradient-primary text-white shadow-lg' 
                      : 'bg-white/50 hover:bg-white/70 text-gray-700'
                  } transform hover:scale-[1.02]`}
                >
                  <div className="font-medium mb-1">{name}</div>
                  {commune && (
                    <div className="text-xs opacity-80 grid grid-cols-2">
                      <span>{formatNumber(commune.totalObs)} obs.</span>
                      <span>{formatNumber(commune.totalEsp)} esp.</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Section Carte */}
      <div className="modern-card p-6 fade-in-scale" style={{ animationDelay: '0.1s' }}>
        {/* Titre */}
        <h3 className="text-xl font-bold text-gradient mb-6 text-center flex items-center justify-center gap-2">
          <span className="w-3 h-3 bg-gradient-secondary rounded-full"></span>
          🗺️ Carte
        </h3>
        
        <div className="space-y-6">
          {/* Toggles modernes */}
          <div className="space-y-4">
            <ToggleSwitch
              checked={showCommunes}
              onChange={setShowCommunes}
              label="Communes"
            />

            <ToggleSwitch
              checked={show3D}
              onChange={setShow3D}
              label="Bâtiments 3D"
            />
          </div>

          {/* Sélecteur de style moderne */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Fond de carte
            </label>
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="input-modern w-full"
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
    </div>
  )
} 