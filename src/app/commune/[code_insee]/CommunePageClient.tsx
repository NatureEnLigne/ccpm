'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '../../../store/useAppStore'
import { 
  loadSyntheseInsee,
  loadPhenoMoisInsee,
  loadTaxonomie,
  loadListesRouges,
  loadStatuts
} from '../../../utils/csvLoader'
import { joinCommuneData, joinSpeciesData, enrichCommuneDataWithNames } from '../../../utils/dataJoiner'
import { loadCommunesGeoJSON } from '../../../utils/geojsonLoader'
import { formatNumber } from '../../../utils/formatters'
import GroupBubble from '../../../components/dashboards/GroupBubble'
import PhenoLine from '../../../components/dashboards/PhenoLine'
import RedListBar from '../../../components/dashboards/RedListBar'
import StatusTreemap from '../../../components/dashboards/StatusTreemap'
import FilterBar from '../../../components/FilterBar'
import SpeciesTable from '../../../components/SpeciesTable'
import ActiveFilters from '../../../components/ActiveFilters'
import type { SyntheseInsee, PhenoMoisInsee, Taxonomie, ListeRouge, Statut } from '../../../types'

interface CommunePageClientProps {
  codeInsee: string
}

// Fonction pour formater les nombres sans abréviation (3300 au lieu de 3.3k)
function formatNumberFull(num: number): string {
  return num.toLocaleString('fr-FR')
}

export default function CommunePageClient({ codeInsee }: CommunePageClientProps) {
  const router = useRouter()
  const { 
    communeData, 
    setCommuneData, 
    speciesData, 
    setSpeciesData, 
    communes, 
    setCommunes, 
    filters,
    resetFiltersOnCommuneChange
  } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Réinitialiser les filtres à chaque changement de commune
  useEffect(() => {
    console.log('🔄 Changement de commune détecté:', codeInsee)
    resetFiltersOnCommuneChange()
  }, [codeInsee, resetFiltersOnCommuneChange])

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('📊 Début du chargement des données pour la commune:', codeInsee)

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
        loadSyntheseInsee() as Promise<SyntheseInsee[]>,
        loadPhenoMoisInsee() as Promise<PhenoMoisInsee[]>,
        loadTaxonomie() as Promise<Taxonomie[]>,
        loadListesRouges() as Promise<ListeRouge[]>,
        loadStatuts() as Promise<Statut[]>
      ])

      console.log('📊 Données chargées pour la page commune:', {
        communes: communesGeoJSON.features.length,
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

  // Récupérer les données de la commune actuelle
  const currentCommune = communeData?.get(codeInsee)
  const communeGeoJSON = communes?.features.find(f => f.properties.insee === codeInsee)

  // Calculer les statistiques filtrées
  const filteredStats = useMemo(() => {
    if (!currentCommune || !speciesData) {
      return { totalObs: 0, totalEsp: 0 }
    }

    let totalObservations = 0
    const uniqueSpecies = new Set<string>()
    const selectedRegne = filters.selectedRegne

    currentCommune.observations.forEach(obs => {
      const cdRef = obs['Cd Ref']
      const species = speciesData.get(cdRef)
      
      if (!species) return

      // Filtrer par règne si spécifié
      if (selectedRegne && species.regne !== selectedRegne) {
        return
      }

      // Appliquer les filtres globaux sur les espèces
      if (filters?.selectedGroupe && species.groupe !== filters.selectedGroupe) return
      
      if (filters?.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
      
      if (filters?.selectedMois) {
        // Vérifier si cette espèce a des données pour le mois sélectionné
        const hasMonthData = currentCommune.phenologie.some(pheno => 
          pheno['CD REF (pheno!mois!insee)'] === cdRef && 
          pheno['Mois Obs'] === filters.selectedMois
        )
        if (!hasMonthData) return
      }
      
      if (filters?.selectedRedListCategory && species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
      if (filters?.selectedOrdre && species.ordre !== filters.selectedOrdre) return
      if (filters?.selectedFamille && species.famille !== filters.selectedFamille) return
      
      if (filters?.selectedStatutReglementaire) {
        // Vérifier si l'espèce a ce statut réglementaire
        const hasStatus = species.statuts.some(statut => 
          statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
        )
        if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
        if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
      }

      // Cette observation passe tous les filtres
      let includeThisObs = true
      
      // Si filtre par mois actif, vérifier que cette observation correspond
      if (filters?.selectedMois) {
        const hasMonthData = currentCommune.phenologie.some(pheno => 
          pheno['CD REF (pheno!mois!insee)'] === cdRef && 
          pheno['Mois Obs'] === filters.selectedMois
        )
        if (!hasMonthData) includeThisObs = false
      }
      
      if (includeThisObs) {
        totalObservations += obs['Nb Obs']
        uniqueSpecies.add(cdRef)
      }
    })

    return {
      totalObs: totalObservations,
      totalEsp: uniqueSpecies.size
    }
  }, [currentCommune, speciesData, filters])

  if (isLoading) {
    // Essayer de récupérer le nom de la commune depuis le GeoJSON déjà chargé
    const communeName = communes?.features.find(f => f.properties.insee === codeInsee)?.properties.nom || `Code INSEE ${codeInsee}`
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement des données...</h2>
          <p className="text-gray-600">Commune : {communeName}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 flex items-center justify-center">
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

  if (!currentCommune) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-gray-500 text-6xl mb-4">🏘️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Commune non trouvée</h2>
          <p className="text-gray-600 mb-4">Aucune donnée disponible pour le code INSEE {codeInsee}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50">
      
      {/* Contenu principal */}
      <main className="container mx-auto px-6 py-8">
        
        {/* Header dans un cadre moderne - même style que CCPM Cartographie */}
        <header className="modern-card shadow-xl mb-8 fade-in-up">
          <div className="p-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 fade-in-scale">
              <button 
                onClick={() => router.push('/')}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors text-lg"
                title="Retour à l'accueil"
              >
                ← 
              </button>
              <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
                    <span className="text-4xl">🏘️</span>
                  {currentCommune.nom || `Commune ${codeInsee}`}
                </h1>
                  <p className="text-gray-600 text-lg font-medium flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    Code INSEE: {codeInsee}
                  </p>
              </div>
            </div>
            
              {/* Stats rapides modernes - même style que l'accueil */}
              <div className="flex space-x-8 fade-in-scale">
              <div className="text-center">
                  <div className="relative">
                    <div className="text-4xl font-bold text-gradient mb-1">
                  {formatNumberFull(filteredStats.totalObs)}
                </div>
                    <div className="badge-modern flex items-center gap-2">
                      <span className="text-base">👁️</span>
                      Observations
                    </div>
                  </div>
              </div>
              <div className="text-center">
                  <div className="relative">
                    <div className="text-4xl font-bold text-gradient mb-1">
                  {formatNumberFull(filteredStats.totalEsp)}
                </div>
                    <div className="badge-modern flex items-center gap-2">
                      <span className="text-base">🦋</span>
                      Espèces
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </header>
        
        {/* Barre de filtres */}
        <FilterBar />

        {/* Filtres actifs */}
        <ActiveFilters />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hover-safe">
          
          {/* Groupes taxonomiques - Bubble chart */}
          <div className="container-hover-safe">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🦋 Groupes taxonomiques
              </h3>
              <div className="h-80">
                <GroupBubble codeInsee={codeInsee} />
              </div>
            </div>
          </div>

          {/* Phénologie mensuelle - Line chart */}
          <div className="container-hover-safe">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                📅 Phénologie mensuelle
              </h3>
              <div className="h-80">
                <PhenoLine codeInsee={codeInsee} />
              </div>
            </div>
          </div>

          {/* Listes rouges - Bar chart */}
          <div className="container-hover-safe">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🚨 Statuts listes rouges
              </h3>
              <div className="h-80">
                <RedListBar codeInsee={codeInsee} />
              </div>
            </div>
          </div>

          {/* Statuts réglementaires - Treemap */}
          <div className="container-hover-safe">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                ⚖️ Statuts réglementaires
              </h3>
              <div className="h-80">
                <StatusTreemap codeInsee={codeInsee} />
              </div>
            </div>
          </div>

        </div>
        
        {/* Tableau des espèces */}
        <div className="mt-8">
          <SpeciesTable codeInsee={codeInsee} />
        </div>
      </main>
    </div>
  )
} 