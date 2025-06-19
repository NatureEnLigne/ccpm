'use client'

import { useEffect, useState, useRef } from 'react'
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
import { MAPBOX_CONFIG } from '../config/mapbox'
import ToggleSwitch from './ToggleSwitch'
import type { SyntheseInsee, PhenoMoisInsee, Taxonomie, ListeRouge, Statut } from '../types'

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
      className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-300 hover:drop-shadow-lg ${
        isSelected ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 hover:bg-gray-200'
      }`}
      title="Ouvrir la fiche de la commune"
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        className={`transition-all duration-300 ${
          isSelected 
            ? 'scale-110 animate-pulse' 
            : ''
        }`}
        strokeWidth="2"
      >
        <defs>
          <linearGradient id="gradient-stroke-fiche" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cd853f" />
            <stop offset="100%" stopColor="#2d5016" />
          </linearGradient>
        </defs>
        {/* Contour du document */}
        <path 
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
          stroke={isSelected ? "#ffffff" : "url(#gradient-stroke-fiche)"} 
        />
        {/* Coin plié */}
        <path 
          d="M14,2 L14,8 L20,8" 
          stroke={isSelected ? "#ffffff" : "url(#gradient-stroke-fiche)"} 
        />
        {/* Lignes de contenu */}
        <path 
          d="M16,13 L8,13 M16,17 L8,17 M10,9 L8,9"
          stroke={isSelected ? "#ffffff" : "url(#gradient-stroke-fiche)"}
          strokeWidth="1.5"
          opacity="0.9"
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Filtrer les communes par nom
  const filteredCommuneNames = Array.from(communeNames.entries())
    .filter(([, name]) => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a[1].localeCompare(b[1]))

  // Défilement automatique vers le haut quand une commune est sélectionnée
  useEffect(() => {
    if (selectedCommune && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [selectedCommune])

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
    <div className="w-full h-full flex flex-col gap-3 overflow-hidden py-2">
      {/* Section Communes CCPM - Hauteur adaptative */}
      <div className="container-hover-safe flex-1 min-h-0">
        <div className="modern-card shadow-xl fade-in-scale h-full flex flex-col">
          {/* Titre avec icône - padding réduit pour plus de largeur */}
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 flex-shrink-0 px-2 pt-4">
            <span className="text-xl">🏛️</span>
            <span className="text-gradient">Communes CCPM</span>
        </h3>

          {/* Contenu scrollable avec hauteur maximale */}
          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 px-2 pb-4">
        {/* Fiche commune sélectionnée */}
        {selectedCommune && communeData?.has(selectedCommune) && (
          <div className="mb-4 p-3 bg-gradient-primary rounded-2xl text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm truncate pr-2 flex items-center gap-2">
                  <span className="text-lg">🏘️</span>
                {communeNames.get(selectedCommune) || selectedCommune}
              </h4>
              <button
                onClick={() => setSelectedCommune(null)}
                  className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 text-sm"
                title="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/20 rounded-lg p-2 text-center">
                  <div className="font-bold text-xs flex items-center justify-center gap-1">
                    <span className="text-xs">👁️</span>
                  {formatNumber(communeData.get(selectedCommune)?.totalObs || 0)}
                </div>
                <div className="data-label-selected text-xs">Observations</div>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-center">
                  <div className="font-bold text-xs flex items-center justify-center gap-1">
                    <span className="text-xs">🦋</span>
                  {formatNumber(communeData.get(selectedCommune)?.totalEsp || 0)}
                </div>
                <div className="data-label-selected text-xs">Espèces</div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <FicheIcon isSelected={true} codeInsee={selectedCommune} />
              </div>
            </div>
          </div>
        )}

        {/* Champ de recherche moderne */}
        <div className="mb-4">
          <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
                placeholder="Nom de la commune"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-full pl-10 pr-4 input-commune"
              style={{
                background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))'
              }}
            />
            </div>
          </div>

          {/* Indicateur de chargement */}
          {isLoading && (
            <div className="modern-card shadow-lg p-4 text-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-3"></div>
              <p className="data-label-unified font-medium text-sm">Chargement des communes...</p>
            </div>
          )}

        {/* Liste des communes */}
          {!isLoading && filteredCommuneNames.length > 0 && (
              <div className="space-y-1.5">
            {filteredCommuneNames.map(([codeInsee, name]) => {
              const commune = communeData?.get(codeInsee)
              const isSelected = selectedCommune === codeInsee
              
              return (
                <button
                  key={codeInsee}
                  onClick={() => setSelectedCommune(codeInsee)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 overflow-hidden ${
                    isSelected 
                      ? 'bg-gradient-primary text-white shadow-lg' 
                      : 'bg-white/50 hover:bg-white/70 text-gray-700'
                  }`}
                >
                    <div className="font-medium mb-1 truncate pr-2 flex items-center gap-2 text-sm">
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
      </div>

      {/* Section Couches - Hauteur réduite */}
      <div className="container-hover-safe flex-shrink-0">
        <div className="modern-card shadow-xl fade-in-scale p-4">
          <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <span className="text-gradient">Couches</span>
          </h4>
        
          {/* Toggles compacts */}
          <div className="space-y-2">
            <ToggleSwitch
              label="Communes"
              checked={showCommunes}
              onChange={setShowCommunes}
            />
            <ToggleSwitch
              label="Bâtiments 3D"
              checked={show3D}
              onChange={setShow3D}
            />
          </div>

          {/* Sélecteur de fonds de plan compact */}
          <div className="mt-4">
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <span className="text-gradient">Fonds de plan</span>
            </label>
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-full"
              style={{
                background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))',
                color: '#2d5016'
              }}
            >
              {Object.entries(MAPBOX_CONFIG.styles).map(([key, label]) => (
                <option key={key} value={key} style={{ color: '#333' }}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Mention Nature en ligne compacte */}
          <div className="mt-3 pt-2 border-t border-white/30">
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Une production{' '}
                <a 
                  href="https://natureenligne.fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-gradient hover:underline"
                >
                  Nature en ligne
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 