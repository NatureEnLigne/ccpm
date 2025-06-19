'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '../../../store/useAppStore'
import { useCommuneData } from '../../../hooks/useCommuneData'
import CommuneHeader from '../../../components/commune/CommuneHeader'
import CommuneActions from '../../../components/commune/CommuneActions'
import CommuneDashboards from '../../../components/commune/CommuneDashboards'
import FilterBar from '../../../components/FilterBar'
import StatsToggle from '../../../components/StatsToggle'
import SpeciesTable from '../../../components/SpeciesTable'
import NoDataAnimation from '../../../components/NoDataAnimation'

interface CommunePageClientProps {
  codeInsee: string
}

export default function CommunePageClient({ codeInsee }: CommunePageClientProps) {
  const router = useRouter()
  const { resetMapView, communes, visibleStats } = useAppStore()
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Utiliser le hook personnalisé pour gérer toutes les données
  const {
    isLoading,
    error,
    currentCommune,
    filteredStats,
    speciesData,
    filters
  } = useCommuneData(codeInsee)

  // Fonction pour retourner à l'accueil avec réinitialisation
  const handleReturnHome = () => {
    resetMapView() // Désélectionne la commune et revient à l'emprise CCPM
    router.push('/') // Navigate vers l'accueil
  }

  if (isLoading) {
    // Essayer de récupérer le nom de la commune depuis le GeoJSON déjà chargé
    const communeName = communes?.features.find(f => f.properties.insee === codeInsee)?.properties.nom || `Code INSEE ${codeInsee}`
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="modern-card shadow-xl rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-3 border-amber-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gradient mb-4">Chargement des données...</h2>
          <p className="data-label-unified text-lg">Commune : {communeName}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="modern-card shadow-xl rounded-2xl p-12 text-center">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gradient mb-4">Erreur</h2>
          <p className="data-label-unified text-lg mb-6">{error}</p>
          <button 
            onClick={handleReturnHome}
            className="modern-card hover:shadow-lg transition-all duration-200 px-6 py-3 rounded-xl"
          >
            <span className="data-label-unified font-medium">Retour à l'accueil</span>
          </button>
        </div>
      </div>
    )
  }

  if (!currentCommune) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="modern-card shadow-xl rounded-2xl p-12 text-center">
          <NoDataAnimation message={`Aucune donnée disponible pour le code INSEE ${codeInsee}`} size="large" />
          <h2 className="text-2xl font-bold text-gradient mb-6 mt-6">Commune non trouvée</h2>
          <button 
            onClick={handleReturnHome}
            className="modern-card hover:shadow-lg transition-all duration-200 px-6 py-3 rounded-xl"
          >
            <span className="data-label-unified font-medium">Retour à l'accueil</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full full-width-layout">
      
      {/* Contenu principal */}
      <main className="w-full full-width-layout px-6 py-8">
        
        {/* Header avec bouton retour et statistiques */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 fade-in-up">
          <CommuneHeader 
            codeInsee={codeInsee}
            currentCommune={currentCommune}
            onReturnHome={handleReturnHome}
          />
          
          {/* Actions et statistiques */}
          {speciesData && (
            <CommuneActions 
              codeInsee={codeInsee}
              speciesData={speciesData}
              currentCommune={currentCommune}
              filters={filters}
              filteredStats={filteredStats}
              linkCopied={linkCopied}
              setLinkCopied={setLinkCopied}
            />
          )}
        </div>
        
        {/* Barre de filtres */}
        <FilterBar compactPadding={true} noBottomMargin={true} />

        {/* Stats Toggle */}
        <div className="mt-6">
          <StatsToggle compactPadding={true} noBottomMargin={true} />
        </div>

        {/* Dashboards */}
        <div className="mt-6">
          <CommuneDashboards codeInsee={codeInsee} />
        </div>
        
        {/* Tableau des espèces */}
        {visibleStats.listeEspeces && (
          <div className="mt-6 w-full">
            <SpeciesTable codeInsee={codeInsee} />
          </div>
        )}
      </main>
    </div>
  )
} 