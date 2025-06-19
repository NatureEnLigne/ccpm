'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '../../../../store/useAppStore'
import FilterBar from '../../../../components/FilterBar'
import StatsToggle from '../../../../components/StatsToggle'
import GroupBubble from '../../../../components/dashboards/GroupBubble'
import PhenoLine from '../../../../components/dashboards/PhenoLine'
import RedListBar from '../../../../components/dashboards/RedListBar'
import StatusTreemap from '../../../../components/dashboards/StatusTreemap'
import GroupsEvolutionStream from '../../../../components/dashboards/GroupsEvolutionStream'
import SpeciesTable from '../../../../components/SpeciesTable'
import NoDataAnimation from '../../../../components/NoDataAnimation'
import { 
  loadSyntheseInsee,
  loadPhenoMoisInsee,
  loadTaxonomie,
  loadListesRouges,
  loadStatuts
} from '../../../../utils/csvLoader'
import { joinCommuneData, joinSpeciesData, enrichCommuneDataWithNames } from '../../../../utils/dataJoiner'
import { loadCommunesGeoJSON } from '../../../../utils/geojsonLoader'
import { formatNumber } from '../../../../utils/formatters'
import { isValueInFilter } from '../../../../utils/filterHelpers'

interface ComparisonPageClientProps {
  codeInseeBase: string
}

function formatNumberFull(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num)
}

// Composant icône de fiche optimisé
const FicheIcon = ({ codeInsee }: { codeInsee: string }) => {
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/commune/${codeInsee}`)
  }

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 p-2 rounded-lg transition-all duration-300 hover:drop-shadow-lg bg-white/20 hover:bg-white/30"
      title="Ouvrir la fiche de la commune"
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        className="transition-all duration-300"
        strokeWidth="2"
      >
        <defs>
          <linearGradient id="gradient-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cd853f" />
            <stop offset="100%" stopColor="#2d5016" />
          </linearGradient>
        </defs>
        {/* Contour du document */}
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="url(#gradient-stroke)" />
        {/* Coin plié */}
        <path d="M14,2 L14,8 L20,8" stroke="url(#gradient-stroke)" />
        {/* Lignes de contenu */}
        <path 
          d="M16,13 L8,13 M16,17 L8,17 M10,9 L8,9"
          stroke="url(#gradient-stroke)"
          strokeWidth="1.5"
          opacity="0.9"
        />
      </svg>
    </button>
  )
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
    filters,
    resetMapView,
    visibleStats
  } = useAppStore()

  const [selectedCommune, setSelectedCommune] = useState<string>('')
  const [showCommuneSelector, setShowCommuneSelector] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [communeNames, setCommuneNames] = useState<Map<string, string>>(new Map())

  // Fonction pour retourner à l'accueil avec réinitialisation
  const handleReturnHome = () => {
    resetMapView() // Désélectionne la commune et revient à l'emprise CCPM
    router.push('/') // Navigate vers l'accueil
  }

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

      // Créer une map des noms des communes (insee -> nom)
      const namesMap = new Map<string, string>()
      communesGeoJSON.features.forEach(feature => {
        namesMap.set(feature.properties.insee, feature.properties.nom)
      })
      setCommuneNames(namesMap)

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
  
  // Filtrer les communes par nom
  const filteredCommuneNames = Array.from(communeNames.entries())
    .filter(([, name]) => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a[1].localeCompare(b[1]))
  
  // Calculer les statistiques filtrées pour chaque commune
  const getFilteredStats = (codeInsee: string) => {
    const commune = communeData?.get(codeInsee)
    if (!commune || !speciesData) {
      return { totalObs: 0, totalEsp: 0 }
    }

    let totalObservations = 0
    const uniqueSpecies = new Set<string>()
    const selectedRegne = filters.selectedRegne

    // Si un filtre par mois est actif, utiliser les données phénologiques
    if (filters?.selectedMois) {
      // Compter directement depuis les données phénologiques
      // Convertir les noms de mois en numéros pour la comparaison
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]
      
      const selectedMonthNumbers = Array.isArray(filters.selectedMois) 
        ? filters.selectedMois.map((monthName: any) => {
            if (typeof monthName === 'string') {
              const index = monthNames.indexOf(monthName)
              return index !== -1 ? index + 1 : parseInt(monthName) || 0
            }
            return monthName || 0
          })
        : (() => {
            const monthValue = filters.selectedMois as any
            if (typeof monthValue === 'string') {
              const index = monthNames.indexOf(monthValue)
              return [index !== -1 ? index + 1 : parseInt(monthValue) || 0]
            }
            return [monthValue || 0]
          })()

      commune.phenologie.forEach(pheno => {
        if (!isValueInFilter(selectedMonthNumbers, pheno['Mois Obs'])) return
        
        const cdRef = pheno['CD REF (pheno!mois!insee)']
        const species = speciesData.get(cdRef)
        
        if (!species) return

        // Appliquer tous les autres filtres sur l'espèce
        if (selectedRegne && species.regne !== selectedRegne) return
        if (filters?.selectedGroupe && species.groupe !== filters.selectedGroupe) return
        if (filters?.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
        if (filters?.selectedRedListCategory) {
          const speciesStatus = species.listeRouge?.['Label Statut'] || 'Non évalué'
          if (!isValueInFilter(filters.selectedRedListCategory, speciesStatus)) return
        }
        if (filters?.selectedOrdre && species.ordre !== filters.selectedOrdre) return
        if (filters?.selectedFamille && species.famille !== filters.selectedFamille) return
        
        if (filters?.selectedStatutReglementaire) {
          const speciesStatuts = species.statuts.map((s: any) => s['LABEL STATUT (statuts)'])
          const hasReglementaryStatus = speciesStatuts.length > 0
          
          if (Array.isArray(filters.selectedStatutReglementaire)) {
            const matchesAnyStatus = filters.selectedStatutReglementaire.some((status: string) => {
              if (status === 'Non réglementé') {
                return !hasReglementaryStatus
              }
              return speciesStatuts.includes(status)
            })
            if (!matchesAnyStatus) return
          } else {
            if (filters.selectedStatutReglementaire === 'Non réglementé') {
              if (hasReglementaryStatus) return
            } else {
              if (!speciesStatuts.includes(filters.selectedStatutReglementaire)) return
            }
          }
        }

        // Cette espèce passe tous les filtres pour ce mois
        totalObservations += pheno['Nb Donnees']
        uniqueSpecies.add(cdRef)
      })
    } else {
      // Logique normale sans filtre par mois
      commune.observations.forEach(obs => {
        const cdRef = obs['Cd Ref']
        const species = speciesData.get(cdRef)
        
        if (!species) return

        // Filtrer par règne si spécifié
        if (selectedRegne && species.regne !== selectedRegne) return

        // Appliquer les filtres globaux sur les espèces
        if (filters?.selectedGroupe && species.groupe !== filters.selectedGroupe) return
        if (filters?.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
        if (filters?.selectedRedListCategory) {
          const speciesStatus = species.listeRouge?.['Label Statut'] || 'Non évalué'
          if (!isValueInFilter(filters.selectedRedListCategory, speciesStatus)) return
        }
        if (filters?.selectedOrdre && species.ordre !== filters.selectedOrdre) return
        if (filters?.selectedFamille && species.famille !== filters.selectedFamille) return
        
        if (filters?.selectedStatutReglementaire) {
          const speciesStatuts = species.statuts.map((s: any) => s['LABEL STATUT (statuts)'])
          const hasReglementaryStatus = speciesStatuts.length > 0
          
          if (Array.isArray(filters.selectedStatutReglementaire)) {
            const matchesAnyStatus = filters.selectedStatutReglementaire.some((status: string) => {
              if (status === 'Non réglementé') {
                return !hasReglementaryStatus
              }
              return speciesStatuts.includes(status)
            })
            if (!matchesAnyStatus) return
          } else {
            if (filters.selectedStatutReglementaire === 'Non réglementé') {
              if (hasReglementaryStatus) return
            } else {
              if (!speciesStatuts.includes(filters.selectedStatutReglementaire)) return
            }
          }
        }

        // Appliquer les filtres d'années
        if (filters?.anneeDebut && obs['An Obs'] < filters.anneeDebut) return
        if (filters?.anneeFin && obs['An Obs'] > filters.anneeFin) return
        
        // Cette observation passe tous les filtres
        totalObservations += obs['Nb Obs']
        uniqueSpecies.add(cdRef)
      })
    }

    return {
      totalObs: totalObservations,
      totalEsp: uniqueSpecies.size
    }
  }
  
  const filteredStatsBase = getFilteredStats(codeInseeBase)
  const filteredStatsComparison = selectedCommune ? getFilteredStats(selectedCommune) : null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="modern-card shadow-xl rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-3 border-amber-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gradient mb-4">Chargement des données...</h2>
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

  if (!communeBase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="modern-card shadow-xl rounded-2xl p-12 text-center">
          <NoDataAnimation message={`Aucune donnée disponible pour le code INSEE ${codeInseeBase}`} size="large" />
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
      <main className="w-full full-width-layout px-6 py-8">
        
        {/* En-tête responsive avec bouton retour et barre de filtres */}
        <div className="mb-6 fade-in-up">
          {/* Version Desktop : bouton retour et filtres sur une ligne */}
          <div className="hidden lg:flex lg:items-center gap-4 mb-6">
            {/* Bouton retour */}
            <div className="modern-card shadow-xl">
              <button 
                onClick={() => router.push(`/commune/${codeInseeBase}`)}
                className="p-3 text-center min-w-[80px] lg:min-w-[120px] hover:bg-white/10 transition-colors rounded-lg"
                title="Retour à la commune"
              >
                <div className="text-2xl lg:text-3xl font-bold text-gradient mb-1">
                  ← 
                </div>
                <div className="nav-button-label">
                  Retour
                </div>
              </button>
            </div>
            
            {/* Barre de filtres */}
            <div className="flex-1">
              <FilterBar noBottomMargin={true} />
            </div>
          </div>
          
          {/* Barre de statistiques - ligne séparée */}
          <div className="hidden lg:block mb-6">
            <StatsToggle noBottomMargin={true} />
          </div>

          {/* Version Mobile : bouton retour et filtres sur deux lignes séparées */}
          <div className="lg:hidden space-y-4 mb-6">
            {/* Première ligne : Bouton retour seul */}
            <div className="modern-card shadow-xl">
              <button 
                onClick={() => router.push(`/commune/${codeInseeBase}`)}
                className="w-full text-center p-4 hover:bg-white/10 transition-colors rounded-lg flex items-center justify-center gap-3"
                title="Retour à la commune"
              >
                <div className="text-2xl font-bold text-gradient">
                  ←
                </div>
                <div className="nav-button-label text-lg">
                  Retour à la commune
                </div>
              </button>
            </div>
            
            {/* Deuxième ligne : Barre de filtres seule */}
            <div>
              <FilterBar noBottomMargin={true} />
            </div>
            
            {/* Troisième ligne : Barre de statistiques */}
            <div>
              <StatsToggle noBottomMargin={true} />
            </div>
          </div>
        </div>

        {/* Version Desktop : Comparaison côte à côte */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          
          {/* Commune de base (gauche) */}
          <div className="space-y-6">
            {/* En-tête commune de base */}
            <div className="modern-card shadow-xl fade-in-up">
              <div className="p-4 text-center">
                <h2 className="text-3xl font-bold mb-1">
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
                                            <div className="data-label-unified">Observations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gradient">
                      {formatNumberFull(filteredStatsBase.totalEsp)}
                    </div>
                                            <div className="data-label-unified">Espèces</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphiques commune de base */}
            {selectedCommune && (
              <>
                {/* Groupes taxonomiques */}
                {visibleStats.groupes && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">🦋</span>
                      <span className="text-gradient">Groupes taxonomiques</span>
                    </h3>
                    <div className="h-80 p-4">
                      <GroupBubble codeInsee={codeInseeBase} />
                    </div>
                  </div>
                )}

                {/* Phénologie mensuelle */}
                {visibleStats.phenologie && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">📅</span>
                      <span className="text-gradient">Phénologie mensuelle</span>
                    </h3>
                    <div className="h-80 p-4">
                      <PhenoLine codeInsee={codeInseeBase} />
                    </div>
                  </div>
                )}

                {/* Statuts listes rouges */}
                {visibleStats.listesRouges && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">🚨</span>
                      <span className="text-gradient">Statuts listes rouges</span>
                    </h3>
                    <div className="h-80 p-4">
                      <RedListBar codeInsee={codeInseeBase} />
                    </div>
                  </div>
                )}

                {/* Statuts réglementaires */}
                {visibleStats.statutsReglementaires && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">⚖️</span>
                      <span className="text-gradient">Statuts réglementaires</span>
                    </h3>
                    <div className="h-80 p-4">
                      <StatusTreemap codeInsee={codeInseeBase} />
                    </div>
                  </div>
                )}

                {/* Évolution des groupes */}
                {visibleStats.evolutionGroupes && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">🌊</span>
                      <span className="text-gradient">Évolution des groupes</span>
                    </h3>
                    <div className="h-80 p-4">
                      <GroupsEvolutionStream codeInsee={codeInseeBase} />
                    </div>
                  </div>
                )}

                {/* Liste des espèces */}
                {visibleStats.listeEspeces && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">📋</span>
                      <span className="text-gradient">Liste des espèces</span>
                    </h3>
                    <div className="p-4">
                      <SpeciesTable codeInsee={codeInseeBase} noCard={true} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Commune de comparaison (droite) */}
          <div className="space-y-6">
            {selectedCommune && communeComparison && filteredStatsComparison ? (
              <>
                {/* En-tête commune de comparaison */}
                <div className="modern-card shadow-xl fade-in-up">
                  <div className="p-4 text-center">
                    <h2 className="text-3xl font-bold mb-1">
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
                        <div className="data-label-unified">Observations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gradient">
                          {formatNumberFull(filteredStatsComparison.totalEsp)}
                        </div>
                        <div className="data-label-unified">Espèces</div>
                      </div>
                      <div className="flex items-center">
                        <FicheIcon codeInsee={selectedCommune} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graphiques commune de comparaison - en miroir */}
                {/* Groupes taxonomiques */}
                {visibleStats.groupes && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">🦋</span>
                      <span className="text-gradient">Groupes taxonomiques</span>
                    </h3>
                    <div className="h-80 p-4">
                      <GroupBubble codeInsee={selectedCommune} />
                    </div>
                  </div>
                )}

                {/* Phénologie mensuelle */}
                {visibleStats.phenologie && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">📅</span>
                      <span className="text-gradient">Phénologie mensuelle</span>
                    </h3>
                    <div className="h-80 p-4">
                      <PhenoLine codeInsee={selectedCommune} />
                    </div>
                  </div>
                )}

                {/* Statuts listes rouges */}
                {visibleStats.listesRouges && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">🚨</span>
                      <span className="text-gradient">Statuts listes rouges</span>
                    </h3>
                    <div className="h-80 p-4">
                      <RedListBar codeInsee={selectedCommune} />
                    </div>
                  </div>
                )}

                {/* Statuts réglementaires */}
                {visibleStats.statutsReglementaires && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">⚖️</span>
                      <span className="text-gradient">Statuts réglementaires</span>
                    </h3>
                    <div className="h-80 p-4">
                      <StatusTreemap codeInsee={selectedCommune} />
                    </div>
                  </div>
                )}

                {/* Évolution des groupes */}
                {visibleStats.evolutionGroupes && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">🌊</span>
                      <span className="text-gradient">Évolution des groupes</span>
                    </h3>
                    <div className="h-80 p-4">
                      <GroupsEvolutionStream codeInsee={selectedCommune} />
                    </div>
                  </div>
                )}

                {/* Liste des espèces */}
                {visibleStats.listeEspeces && (
                  <div className="modern-card shadow-xl fade-in-up">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                      <span className="text-lg">📋</span>
                      <span className="text-gradient">Liste des espèces</span>
                    </h3>
                    <div className="p-4">
                      <SpeciesTable codeInsee={selectedCommune} noCard={true} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Panneau de sélection de commune - reprend exactement le contenu de 🏛️ Communes CCPM */
              <div className="modern-card shadow-xl fade-in-up flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Titre avec icône */}
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 flex-shrink-0">
                  <span className="text-2xl">🏛️</span>
                  <span className="text-gradient">Communes CCPM</span>
                </h3>

                {/* Message d'instruction */}
                <div className="mb-6 p-4 rounded-xl border border-amber-200/50 flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))'
                }}>
                  <p className="text-center font-medium" style={{
                    background: 'linear-gradient(135deg, #cd853f, #2d5016)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Sélectionner une commune pour commencer la comparaison
                  </p>
                </div>

                {/* Contenu scrollable avec hauteur contrainte */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {/* Champ de recherche moderne */}
                  <div className="mb-6 flex-shrink-0">
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
                    <div className="modern-card shadow-lg p-6 text-center mb-6">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-4"></div>
                      <p className="data-label-unified font-medium">Chargement des communes...</p>
                    </div>
                  )}

                  {/* Liste des communes */}
                  {!isLoading && filteredCommuneNames.length > 0 && (
                    <div className="space-y-2">
                      {filteredCommuneNames.map(([codeInsee, name]) => {
                        const commune = communeData?.get(codeInsee)
                        const isSelected = selectedCommune === codeInsee
                        
                        // Ne pas afficher la commune de base
                        if (codeInsee === codeInseeBase) return null
                        
                        return (
                          <button
                            key={codeInsee}
                            onClick={() => setSelectedCommune(codeInsee)}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 overflow-hidden ${
                              isSelected 
                                ? 'bg-gradient-primary text-white shadow-lg' 
                                : 'bg-white/50 hover:bg-white/70 text-gray-700'
                            }`}
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
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Version Mobile : Statistiques à la suite */}
        <div className="lg:hidden space-y-6">
          {/* En-têtes des communes */}
          <div className="space-y-4">
            {/* En-tête commune de base */}
            <div className="modern-card shadow-xl fade-in-up">
              <div className="p-4 text-center">
                <h2 className="text-3xl font-bold mb-1">
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
                    <div className="data-label-unified">Observations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gradient">
                      {formatNumberFull(filteredStatsBase.totalEsp)}
                    </div>
                    <div className="data-label-unified">Espèces</div>
                  </div>
                </div>
              </div>
            </div>

            {/* En-tête commune de comparaison */}
            {selectedCommune && communeComparison && filteredStatsComparison ? (
              <div className="modern-card shadow-xl fade-in-up">
                <div className="p-4 text-center">
                  <h2 className="text-3xl font-bold mb-1">
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
                      <div className="data-label-unified">Observations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gradient">
                        {formatNumberFull(filteredStatsComparison.totalEsp)}
                      </div>
                      <div className="data-label-unified">Espèces</div>
                    </div>
                    <div className="flex items-center">
                      <FicheIcon codeInsee={selectedCommune} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Panneau de sélection de commune mobile */
              <div className="modern-card shadow-xl fade-in-up flex flex-col" style={{ height: 'calc(50vh)' }}>
                {/* Titre avec icône */}
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 flex-shrink-0">
                  <span className="text-2xl">🏛️</span>
                  <span className="text-gradient">Communes CCPM</span>
                </h3>

                {/* Message d'instruction */}
                <div className="mb-6 p-4 rounded-xl border border-amber-200/50 flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))'
                }}>
                  <p className="text-center font-medium" style={{
                    background: 'linear-gradient(135deg, #cd853f, #2d5016)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Sélectionner une commune pour commencer la comparaison
                  </p>
                </div>

                {/* Contenu scrollable avec hauteur contrainte */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {/* Champ de recherche moderne */}
                  <div className="mb-6 flex-shrink-0">
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
                    <div className="modern-card shadow-lg p-6 text-center mb-6">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-4"></div>
                      <p className="data-label-unified font-medium">Chargement des communes...</p>
                    </div>
                  )}

                  {/* Liste des communes */}
                  {!isLoading && filteredCommuneNames.length > 0 && (
                    <div className="space-y-2">
                      {filteredCommuneNames.map(([codeInsee, name]) => {
                        const commune = communeData?.get(codeInsee)
                        const isSelected = selectedCommune === codeInsee
                        
                        // Ne pas afficher la commune de base
                        if (codeInsee === codeInseeBase) return null
                        
                        return (
                          <button
                            key={codeInsee}
                            onClick={() => setSelectedCommune(codeInsee)}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 overflow-hidden ${
                              isSelected 
                                ? 'bg-gradient-primary text-white shadow-lg' 
                                : 'bg-white/50 hover:bg-white/70 text-gray-700'
                            }`}
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
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Statistiques à la suite en version mobile */}
          {selectedCommune && (
            <div className="space-y-6">
              {/* 🦋 Groupes taxonomiques - Commune de base */}
              {visibleStats.groupes && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">🦋</span>
                    <span className="text-gradient">Groupes taxonomiques - {communeBase.properties.nom}</span>
                  </h3>
                  <div className="h-80 p-4">
                    <GroupBubble codeInsee={codeInseeBase} />
                  </div>
                </div>
              )}

              {/* 🦋 Groupes taxonomiques - Commune de comparaison */}
              {visibleStats.groupes && communeComparison && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">🦋</span>
                    <span className="text-gradient">Groupes taxonomiques - {communeComparison.properties.nom}</span>
                  </h3>
                  <div className="h-80 p-4">
                    <GroupBubble codeInsee={selectedCommune} />
                  </div>
                </div>
              )}

              {/* 📅 Phénologie mensuelle - Commune de base */}
              {visibleStats.phenologie && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">📅</span>
                    <span className="text-gradient">Phénologie mensuelle - {communeBase.properties.nom}</span>
                  </h3>
                  <div className="h-80 p-4">
                    <PhenoLine codeInsee={codeInseeBase} />
                  </div>
                </div>
              )}

              {/* 📅 Phénologie mensuelle - Commune de comparaison */}
              {visibleStats.phenologie && communeComparison && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">📅</span>
                    <span className="text-gradient">Phénologie mensuelle - {communeComparison.properties.nom}</span>
                  </h3>
                  <div className="h-80 p-4">
                    <PhenoLine codeInsee={selectedCommune} />
                  </div>
                </div>
              )}

              {/* 🚨 Statuts listes rouges - Commune de base */}
              {visibleStats.listesRouges && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">🚨</span>
                    <span className="text-gradient">Statuts listes rouges - {communeBase.properties.nom}</span>
                  </h3>
                  <div className="h-80 p-4">
                    <RedListBar codeInsee={codeInseeBase} />
                  </div>
                </div>
              )}

              {/* 🚨 Statuts listes rouges - Commune de comparaison */}
              {visibleStats.listesRouges && communeComparison && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">🚨</span>
                    <span className="text-gradient">Statuts listes rouges - {communeComparison.properties.nom}</span>
                  </h3>
                  <div className="h-80 p-4">
                    <RedListBar codeInsee={selectedCommune} />
                  </div>
                </div>
              )}

              {/* ⚖️ Statuts réglementaires - Commune de base */}
              {visibleStats.statutsReglementaires && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">⚖️</span>
                    <span className="text-gradient">Statuts réglementaires - {communeBase.properties.nom}</span>
                  </h3>
                  <div className="h-80 p-4">
                    <StatusTreemap codeInsee={codeInseeBase} />
                  </div>
                </div>
              )}

              {/* ⚖️ Statuts réglementaires - Commune de comparaison */}
              {visibleStats.statutsReglementaires && communeComparison && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">⚖️</span>
                    <span className="text-gradient">Statuts réglementaires - {communeComparison.properties.nom}</span>
                  </h3>
                  <div className="h-80 p-4">
                    <StatusTreemap codeInsee={selectedCommune} />
                  </div>
                </div>
              )}

              {/* 📋 Liste des espèces - Commune de base */}
              {visibleStats.listeEspeces && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">📋</span>
                    <span className="text-gradient">Liste des espèces - {communeBase.properties.nom}</span>
                  </h3>
                  <div className="p-4">
                    <SpeciesTable codeInsee={codeInseeBase} noCard={true} />
                  </div>
                </div>
              )}

              {/* 📋 Liste des espèces - Commune de comparaison */}
              {visibleStats.listeEspeces && communeComparison && (
                <div className="modern-card shadow-xl fade-in-up">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 p-4 pb-0">
                    <span className="text-lg">📋</span>
                    <span className="text-gradient">Liste des espèces - {communeComparison.properties.nom}</span>
                  </h3>
                  <div className="p-4">
                    <SpeciesTable codeInsee={selectedCommune} noCard={true} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 