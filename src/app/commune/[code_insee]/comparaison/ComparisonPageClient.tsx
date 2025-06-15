'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '../../../../store/useAppStore'
import FilterBar from '../../../../components/FilterBar'
import GroupBubble from '../../../../components/dashboards/GroupBubble'
import PhenoLine from '../../../../components/dashboards/PhenoLine'
import RedListBar from '../../../../components/dashboards/RedListBar'
import StatusTreemap from '../../../../components/dashboards/StatusTreemap'
import { 
  loadSyntheseInsee,
  loadPhenoMoisInsee,
  loadTaxonomie,
  loadListesRouges,
  loadStatuts
} from '../../../../utils/csvLoader'
import { joinCommuneData, joinSpeciesData, enrichCommuneDataWithNames } from '../../../../utils/dataJoiner'
import { loadCommunesGeoJSON } from '../../../../utils/geojsonLoader'

interface ComparisonPageClientProps {
  codeInseeBase: string
}

type StatisticType = 'groupes' | 'phenologie' | 'listes_rouges' | 'statuts_reglementaires'

const statisticOptions = [
  { value: 'groupes', label: 'Groupes taxonomiques', icon: '🦋' },
  { value: 'phenologie', label: 'Phénologie mensuelle', icon: '📅' },
  { value: 'listes_rouges', label: 'Statuts listes rouges', icon: '🚨' },
  { value: 'statuts_reglementaires', label: 'Statuts réglementaires', icon: '⚖️' }
]

function formatNumberFull(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num)
}

export default function ComparisonPageClient({ codeInseeBase }: ComparisonPageClientProps) {
  const router = useRouter()
  const { 
    communes, 
    setCommunes,
    communeData,
    setCommuneData,
    speciesData, 
    setSpeciesData,
    filters
  } = useAppStore()

  const [selectedStatistic, setSelectedStatistic] = useState<StatisticType>('groupes')
  const [selectedCommune, setSelectedCommune] = useState<string>('')
  const [showCommuneSelector, setShowCommuneSelector] = useState(false)
  const [showStatisticSelector, setShowStatisticSelector] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('📊 Début du chargement des données pour la comparaison')

      // Charger toutes les données en parallèle
      const [
        communesGeoJSON,
        syntheseData,
        phenoData,
        taxonomieData,
        listesRougesData,
        statutsData
      ] = await Promise.all([
        loadCommunesGeoJSON(),
        loadSyntheseInsee(),
        loadPhenoMoisInsee(),
        loadTaxonomie(),
        loadListesRouges(),
        loadStatuts()
      ])

      console.log('📊 Données chargées pour la comparaison:', {
        communes: communesGeoJSON.features.length,
        synthese: syntheseData.length,
        pheno: phenoData.length,
        taxonomie: taxonomieData.length,
        listesRouges: listesRougesData.length,
        statuts: statutsData.length
      })

      // Joindre les données
      let communeDataMap = joinCommuneData(syntheseData as any[], phenoData as any[])
      const speciesDataMap = joinSpeciesData(
        syntheseData as any[],
        taxonomieData as any[],
        listesRougesData as any[],
        statutsData as any[]
      )

      // Enrichir avec les noms des communes
      communeDataMap = enrichCommuneDataWithNames(communeDataMap, communesGeoJSON)

      // Mettre à jour le store
      setCommunes(communesGeoJSON)
      setCommuneData(communeDataMap)
      setSpeciesData(speciesDataMap)

    } catch (err) {
      console.error('❌ Erreur lors du chargement des données:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  const communeBase = communes?.features.find(f => f.properties.insee === codeInseeBase)
  const communeComparison = communes?.features.find(f => f.properties.insee === selectedCommune)
  
  // Calculer les statistiques filtrées pour chaque commune
  const getFilteredStats = (codeInsee: string) => {
    const commune = communeData?.get(codeInsee)
    if (!commune || !speciesData) {
      return { totalObs: 0, totalEsp: 0 }
    }

    let totalObservations = 0
    const uniqueSpecies = new Set<string>()

    commune.observations.forEach(obs => {
      const cdRef = obs['Cd Ref']
      const species = speciesData.get(cdRef)
      
      if (species) {
        // Appliquer les filtres
        if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) return
        if (filters.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
        if (filters.selectedRedListCategory) {
          if (filters.selectedRedListCategory === 'Non évalué') {
            if (species.listeRouge) return
          } else {
            if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
          }
        }
        if (filters.selectedOrdre && species.ordre !== filters.selectedOrdre) return
        if (filters.selectedFamille && species.famille !== filters.selectedFamille) return
        if (filters.selectedStatutReglementaire) {
          const hasStatus = species.statuts.some(statut => 
            statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
          )
          if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
          if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
        }
        
        totalObservations += (obs as any)['Nb Donnees']
        uniqueSpecies.add(cdRef)
      }
    })

    return {
      totalObs: totalObservations,
      totalEsp: uniqueSpecies.size
    }
  }
  
  const filteredStatsBase = getFilteredStats(codeInseeBase)
  const filteredStatsComparison = selectedCommune ? getFilteredStats(selectedCommune) : null

  const renderStatistic = (codeInsee: string) => {
    const commonProps = { codeInsee }
    
    switch (selectedStatistic) {
      case 'groupes':
        return <GroupBubble {...commonProps} />
      case 'phenologie':
        return <PhenoLine {...commonProps} />
      case 'listes_rouges':
        return <RedListBar {...commonProps} />
      case 'statuts_reglementaires':
        return <StatusTreemap {...commonProps} />
      default:
        return <GroupBubble {...commonProps} />
    }
  }

  const getStatisticLabel = () => {
    return statisticOptions.find(opt => opt.value === selectedStatistic)?.label || 'Statistique'
  }

  const getStatisticIcon = () => {
    return statisticOptions.find(opt => opt.value === selectedStatistic)?.icon || '📊'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement des données...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors border border-blue-300/50"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  if (!communeBase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-gray-500 text-6xl mb-4">🏘️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Commune non trouvée</h2>
          <p className="text-gray-600 mb-4">Aucune donnée disponible pour le code INSEE {codeInseeBase}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors border border-blue-300/50"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full full-width-layout">
      <main className="w-full full-width-layout px-6 py-8">
        
        {/* En-tête avec bouton retour et barre de filtres */}
        <div className="flex items-center gap-4 mb-8 fade-in-up">
          {/* Bouton retour */}
          <div className="modern-card shadow-xl">
            <button 
              onClick={() => router.push(`/commune/${codeInseeBase}`)}
              className="p-3 text-center min-w-[120px] hover:bg-white/10 transition-colors rounded-lg"
              title="Retour à la commune"
            >
              <div className="text-xl font-bold text-gradient mb-1">
                ←
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Retour
              </div>
            </button>
          </div>
          
          {/* Barre de filtres */}
          <div className="flex-1">
            <FilterBar />
          </div>
        </div>

        {/* Sélecteurs de statistique et commune */}
        <div className="flex items-center gap-4 mb-8 fade-in-up">
          {/* Sélecteur de statistique */}
          <div className="modern-card shadow-xl relative">
            <button 
              onClick={() => setShowStatisticSelector(!showStatisticSelector)}
              className="p-3 text-center min-w-[200px] hover:bg-white/10 transition-colors rounded-lg"
              title="Choisir la statistique à comparer"
            >
              <div className="text-xl font-bold text-gradient mb-1">
                {getStatisticIcon()}
              </div>
              <div className="text-gray-600 font-medium text-sm">
                {getStatisticLabel()}
              </div>
            </button>
            
            {showStatisticSelector && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-white/20 z-50">
                {statisticOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedStatistic(option.value as StatisticType)
                      setShowStatisticSelector(false)
                    }}
                    className="w-full p-3 text-left hover:bg-white/20 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-gray-700 font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sélecteur de commune */}
          <div className="modern-card shadow-xl relative">
            <button 
              onClick={() => setShowCommuneSelector(!showCommuneSelector)}
              className="p-3 text-center min-w-[200px] hover:bg-white/10 transition-colors rounded-lg"
              title="Choisir la commune à comparer"
            >
              <div className="text-xl font-bold text-gradient mb-1">
                🏘️
              </div>
              <div className="text-gray-600 font-medium text-sm">
                {communeComparison ? communeComparison.properties.nom : 'Choisir une commune'}
              </div>
            </button>
            
            {showCommuneSelector && (
              <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-white/20 z-50">
                {communes?.features
                  .filter(f => f.properties.insee !== codeInseeBase)
                  .sort((a, b) => a.properties.nom.localeCompare(b.properties.nom))
                  .map((commune) => (
                    <button
                      key={commune.properties.insee}
                      onClick={() => {
                        setSelectedCommune(commune.properties.insee)
                        setShowCommuneSelector(false)
                      }}
                      className="w-full p-3 text-left hover:bg-white/20 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="text-gray-700 font-medium">{commune.properties.nom}</div>
                      <div className="text-gray-500 text-sm">Code INSEE: {commune.properties.insee}</div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Comparaison côte à côte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Commune de base (gauche) */}
          <div className="space-y-6">
            {/* En-tête commune de base */}
            <div className="modern-card shadow-xl fade-in-up">
              <div className="p-4 text-center">
                <h2 className="text-xl font-bold mb-1">
                  <span className="text-gradient">{communeBase.properties.nom}</span>
                </h2>
                <p className="species-count-title mb-3">
                  Code INSEE: {codeInseeBase}
                </p>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gradient">
                      {formatNumberFull(filteredStatsBase.totalObs)}
                    </div>
                    <div className="text-gray-600 text-sm">Observations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gradient">
                      {formatNumberFull(filteredStatsBase.totalEsp)}
                    </div>
                    <div className="text-gray-600 text-sm">Espèces</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphique commune de base */}
            <div className="modern-card shadow-xl fade-in-up">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                <span className="text-lg">{getStatisticIcon()}</span>
                <span className="text-gradient">{getStatisticLabel()}</span>
              </h3>
              <div className="h-80 p-4">
                {renderStatistic(codeInseeBase)}
              </div>
            </div>
          </div>

          {/* Commune de comparaison (droite) */}
          <div className="space-y-6">
            {selectedCommune && communeComparison && filteredStatsComparison ? (
              <>
                {/* En-tête commune de comparaison */}
                <div className="modern-card shadow-xl fade-in-up">
                  <div className="p-4 text-center">
                    <h2 className="text-xl font-bold mb-1">
                      <span className="text-gradient">{communeComparison.properties.nom}</span>
                    </h2>
                    <p className="species-count-title mb-3">
                      Code INSEE: {selectedCommune}
                    </p>
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gradient">
                          {formatNumberFull(filteredStatsComparison.totalObs)}
                        </div>
                        <div className="text-gray-600 text-sm">Observations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gradient">
                          {formatNumberFull(filteredStatsComparison.totalEsp)}
                        </div>
                        <div className="text-gray-600 text-sm">Espèces</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graphique commune de comparaison */}
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">{getStatisticIcon()}</span>
                    <span className="text-gradient">{getStatisticLabel()}</span>
                  </h3>
                  <div className="h-80 p-4">
                    {renderStatistic(selectedCommune)}
                  </div>
                </div>
              </>
            ) : (
              /* Placeholder pour sélection de commune */
              <div className="modern-card shadow-xl fade-in-up">
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-6xl mb-4">🏘️</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Sélectionnez une commune
                  </h3>
                  <p className="text-gray-500">
                    Choisissez une commune à comparer avec {communeBase.properties.nom}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 