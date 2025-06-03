'use client'

import { useEffect, useState } from 'react'
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
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import ErrorState from '../../../components/ui/ErrorState'

interface CommunePageClientProps {
  codeInsee: string
}

export default function CommunePageClient({ codeInsee }: CommunePageClientProps) {
  const router = useRouter()

  const {
    communes,
    communeData,
    speciesData,
    setCommunes,
    setCommuneData,
    setSpeciesData
  } = useAppStore()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegne, setSelectedRegne] = useState('Tous') // Tous par défaut

  // Chargement des données au montage
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      setError(null)

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-nature flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md w-full animate-scale-in">
          <LoadingSpinner size="lg" text={`Chargement des données de la commune ${codeInsee}...`} />
          
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="glass-skeleton h-2 w-32 rounded"></div>
              <span>Données naturalistes</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="glass-skeleton h-2 w-24 rounded" style={{ animationDelay: '0.2s' }}></div>
              <span>Taxonomie</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="glass-skeleton h-2 w-28 rounded" style={{ animationDelay: '0.4s' }}></div>
              <span>Phénologie</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-nature flex items-center justify-center p-4">
        <ErrorState
          title="Erreur de chargement"
          message={`${error} pour la commune ${codeInsee}`}
          onRetry={loadAllData}
          className="max-w-md w-full"
        />
      </div>
    )
  }

  if (!currentCommune) {
    return (
      <div className="min-h-screen bg-gradient-nature flex items-center justify-center p-4">
        <ErrorState
          title="Commune non trouvée"
          message={`Aucune donnée disponible pour le code INSEE ${codeInsee}`}
          onRetry={() => router.push('/')}
          className="max-w-md w-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-nature">
      
      {/* Header responsive */}
      <header className="glass-strong border-b border-white/20 sticky top-0 z-10 animate-slide-up">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
              <button 
                onClick={() => router.push('/')}
                className="glass-button p-2 flex-shrink-0"
                title="Retour à l'accueil"
              >
                ← 
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
                  {currentCommune.nom || `Commune ${codeInsee}`}
                </h1>
                <p className="text-sm text-gray-600">Code INSEE: {codeInsee}</p>
              </div>
            </div>
            
            {/* Stats rapides - responsive */}
            <div className="flex space-x-4 md:space-x-6 flex-shrink-0">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-600">
                  {formatNumber(currentCommune.totalObs)}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Observations</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">
                  {formatNumber(currentCommune.totalEsp)}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Espèces</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 md:px-6 py-4 md:py-8 animate-fade-in">
        
        {/* Barre de filtres */}
        <div className="mb-6">
          <FilterBar
            selectedRegne={selectedRegne}
            onRegneChange={setSelectedRegne}
          />
        </div>

        {/* Filtres actifs */}
        <ActiveFilters />

        {/* Grille responsive des graphiques */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-8">
          
          {/* Groupes taxonomiques - Bubble chart */}
          <div className="glass-card rounded-2xl p-4 md:p-6 animate-scale-in">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
              🦋 Groupes taxonomiques
            </h3>
            <div className="h-64 md:h-80">
              <GroupBubble codeInsee={codeInsee} selectedRegne={selectedRegne} />
            </div>
          </div>

          {/* Phénologie mensuelle - Line chart */}
          <div className="glass-card rounded-2xl p-4 md:p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
              📅 Phénologie mensuelle
            </h3>
            <div className="h-64 md:h-80">
              <PhenoLine codeInsee={codeInsee} selectedRegne={selectedRegne} />
            </div>
          </div>

          {/* Listes rouges - Bar chart */}
          <div className="glass-card rounded-2xl p-4 md:p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
              🚨 Statuts listes rouges
            </h3>
            <div className="h-64 md:h-80">
              <RedListBar codeInsee={codeInsee} selectedRegne={selectedRegne} />
            </div>
          </div>

          {/* Statuts réglementaires - Treemap */}
          <div className="glass-card rounded-2xl p-4 md:p-6 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
              ⚖️ Statuts réglementaires
            </h3>
            <div className="h-64 md:h-80">
              <StatusTreemap codeInsee={codeInsee} selectedRegne={selectedRegne} />
            </div>
          </div>

        </div>
        
        {/* Tableau des espèces */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <SpeciesTable codeInsee={codeInsee} selectedRegne={selectedRegne} />
        </div>
      </main>
    </div>
  )
} 