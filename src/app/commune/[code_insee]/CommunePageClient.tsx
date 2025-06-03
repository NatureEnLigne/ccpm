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
import type { SyntheseInsee, PhenoMoisInsee, Taxonomie, ListeRouge, Statut } from '../../../types'

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement des données...</h2>
          <p className="text-gray-600">Commune {codeInsee}</p>
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
      
      {/* Header */}
      <header className="glass border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                title="Retour à l'accueil"
              >
                ← 
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {currentCommune.nom || `Commune ${codeInsee}`}
                </h1>
                <p className="text-gray-600">Code INSEE: {codeInsee}</p>
              </div>
            </div>
            
            {/* Stats rapides */}
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(currentCommune.totalObs)}
                </div>
                <div className="text-sm text-gray-600">Observations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(currentCommune.totalEsp)}
                </div>
                <div className="text-sm text-gray-600">Espèces</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-6 py-8">
        
        {/* Barre de filtres */}
        <FilterBar 
          selectedRegne={selectedRegne}
          onRegneChange={setSelectedRegne}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Groupes taxonomiques - Bubble chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              🦋 Groupes taxonomiques
            </h3>
            <div className="h-80">
              <GroupBubble codeInsee={codeInsee} selectedRegne={selectedRegne} />
            </div>
          </div>

          {/* Phénologie mensuelle - Line chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              📅 Phénologie mensuelle
            </h3>
            <div className="h-80">
              <PhenoLine codeInsee={codeInsee} selectedRegne={selectedRegne} />
            </div>
          </div>

          {/* Listes rouges - Bar chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              🚨 Statuts listes rouges
            </h3>
            <div className="h-80">
              <RedListBar codeInsee={codeInsee} selectedRegne={selectedRegne} />
            </div>
          </div>

          {/* Statuts réglementaires - Treemap */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              ⚖️ Statuts réglementaires
            </h3>
            <div className="h-80">
              <StatusTreemap codeInsee={codeInsee} selectedRegne={selectedRegne} />
            </div>
          </div>

        </div>
        
        {/* Tableau des espèces */}
        <div className="mt-8">
          <SpeciesTable codeInsee={codeInsee} selectedRegne={selectedRegne} />
        </div>
      </main>
    </div>
  )
} 