'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

// Composant icône de fiche optimisé
const FicheIcon = ({ isSelected, codeInsee }: { isSelected: boolean, codeInsee: string }) => {
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/commune/${codeInsee}`)
  }

  return (
    <button
      onClick={handleClick}
      className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-300 hover:scale-110 hover:drop-shadow-lg ${
        isSelected ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 hover:bg-gray-200'
      }`}
      title="Ouvrir la fiche de la commune"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        className={`transition-all duration-300 ${
          isSelected 
            ? 'stroke-white scale-110 animate-pulse' 
            : 'stroke-gray-600'
        }`}
        strokeWidth="2"
      >
        {/* Contour du document */}
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        {/* Coin plié */}
        <path d="M14,2 L14,8 L20,8" />
        {/* Lignes de contenu */}
        <path 
          d="M16,13 L8,13 M16,17 L8,17 M10,9 L8,9"
          className={`transition-all duration-300 ${
            isSelected 
              ? 'stroke-white/90' 
              : 'stroke-var(--color-accent)'
          }`}
          strokeWidth="1.5"
        />
      </svg>
    </button>
  )
}

export default function Sidebar() {
  const {
    selectedCommune,
    setSelectedCommune,
    showCommunes,
    setShowCommunes,
    show3D,
    setShow3D,
    mapStyle,
    setMapStyle,
    communeData,
    setCommuneData,
    speciesData,
    setSpeciesData
  } = useAppStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [communeNames, setCommuneNames] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Filtrer les communes par nom
  const filteredCommuneNames = Array.from(communeNames.entries())
    .filter(([, name]) => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a[1].localeCompare(b[1]))

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
    <div className="w-96 flex flex-col gap-6 overflow-visible">
      {/* Section Communes CCPM */}
      <div className="container-hover-safe">
      <div className="modern-card p-6 fade-in-scale overflow-hidden">
          {/* Titre avec icône plus lisible */}
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <span className="text-gradient">Communes CCPM</span>
        </h3>

        {/* Fiche commune sélectionnée */}
        {selectedCommune && communeData?.has(selectedCommune) && (
          <div className="mb-6 p-4 bg-gradient-primary rounded-2xl text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg truncate pr-2 flex items-center gap-2">
                  <span className="text-xl">🏘️</span>
                {communeNames.get(selectedCommune) || selectedCommune}
              </h4>
              <button
                onClick={() => setSelectedCommune(null)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 flex-shrink-0 text-lg"
                title="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="font-bold text-xl flex items-center justify-center gap-1">
                    <span className="text-sm">👁️</span>
                  {formatNumber(communeData.get(selectedCommune)?.totalObs || 0)}
                </div>
                <div className="opacity-90">Observations</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="font-bold text-xl flex items-center justify-center gap-1">
                    <span className="text-sm">🦋</span>
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
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
                placeholder="Nom de la commune"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern w-full pl-10 pr-4"
            />
            </div>
          </div>

          {/* Indicateur de chargement */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Chargement des communes...</p>
            </div>
          )}

        {/* Liste des communes */}
          {!isLoading && filteredCommuneNames.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto overflow-x-hidden">
            {filteredCommuneNames.map(([codeInsee, name]) => {
              const commune = communeData?.get(codeInsee)
              const isSelected = selectedCommune === codeInsee
              
              return (
                <button
                  key={codeInsee}
                  onClick={() => setSelectedCommune(codeInsee)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 overflow-hidden ${
                    isSelected 
                      ? 'bg-gradient-primary text-white shadow-lg' 
                      : 'bg-white/50 hover:bg-white/70 text-gray-700'
                  } transform hover:scale-[1.02]`}
                >
                    <div className="font-medium mb-1 truncate pr-2 flex items-center gap-2">
                      <span className="text-sm">🏘️</span>
                      {name}
                    </div>
                  {commune && (
                    <div className="text-xs opacity-80 flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-shrink">
                          <span className="whitespace-nowrap flex items-center gap-1">
                            <span className="text-xs">👁️</span>
                            {formatNumber(commune.totalObs)} obs.
                          </span>
                          <span className="whitespace-nowrap flex items-center gap-1">
                            <span className="text-xs">🦋</span>
                            {formatNumber(commune.totalEsp)} esp.
                          </span>
                      </div>
                      <FicheIcon isSelected={isSelected} codeInsee={codeInsee} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
        </div>
      </div>

      {/* Section Couches */}
      <div className="container-hover-safe">
        <div className="modern-card p-6 fade-in-scale">
          <h4 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <span className="text-gradient">Couches</span>
          </h4>
        
          {/* Toggles */}
          <div className="space-y-4">
            <ToggleSwitch
              label="🏘️ Communes"
              checked={showCommunes}
              onChange={setShowCommunes}
            />
            <ToggleSwitch
              label="🏢 Bâtiments 3D"
              checked={show3D}
              onChange={setShow3D}
            />
          </div>

          {/* Sélecteur de fonds de plan */}
          <div className="mt-6">
            <label className="block text-xl font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">🌍</span>
              <span className="text-gradient">Fonds de plan</span>
            </label>
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="input-modern w-full"
            >
              {Object.entries(MAPBOX_STYLES).map(([key, label]) => (
                <option key={key} value={key}>
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