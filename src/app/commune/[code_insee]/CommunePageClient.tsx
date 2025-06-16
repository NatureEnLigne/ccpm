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

import type { SyntheseInsee, PhenoMoisInsee, Taxonomie, ListeRouge, Statut } from '../../../types'

interface CommunePageClientProps {
  codeInsee: string
}

// Fonction pour formater les nombres sans abréviation (3300 au lieu de 3.3k)
function formatNumberFull(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num)
}

// Fonction pour générer et télécharger le CSV des espèces filtrées
function generateSpeciesCSV(codeInsee: string, speciesData: any, currentCommune: any, filters: any): void {
  if (!speciesData || !currentCommune) return

  const rows: any[] = []
  const selectedRegne = filters.selectedRegne

  // Si un filtre par mois est actif, utiliser les données phénologiques
  if (filters?.selectedMois) {
    // Grouper les données phénologiques par CD REF pour ce mois
    const monthSpeciesData = new Map<string, number>()
    
    currentCommune.phenologie.forEach((pheno: any) => {
      if (pheno['Mois Obs'] !== filters.selectedMois) return
      
      const cdRef = pheno['CD REF (pheno!mois!insee)']
      const species = speciesData.get(cdRef)
      if (!species) return

      // Appliquer tous les filtres sur l'espèce
      if (selectedRegne && species.regne !== selectedRegne) return
      if (filters?.selectedGroupe && species.groupe !== filters.selectedGroupe) return
      if (filters?.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
      if (filters?.selectedRedListCategory) {
        if (filters.selectedRedListCategory === 'Non évalué') {
          if (species.listeRouge) return
        } else {
          if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
        }
      }
      if (filters?.selectedOrdre && species.ordre !== filters.selectedOrdre) return
      if (filters?.selectedFamille && species.famille !== filters.selectedFamille) return
      
      if (filters?.selectedStatutReglementaire) {
        const hasStatus = species.statuts.some((statut: any) => 
          statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
        )
        if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
        if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
      }

      // Ajouter les observations de ce mois pour cette espèce
      const current = monthSpeciesData.get(cdRef) || 0
      monthSpeciesData.set(cdRef, current + pheno['Nb Donnees'])
    })

    // Créer les lignes du CSV avec les données du mois filtré
    monthSpeciesData.forEach((totalObs, cdRef) => {
      const species = speciesData.get(cdRef)
      if (!species || totalObs === 0) return

      rows.push({
        cdRef,
        nomComplet: species.nomComplet || species.nomValide || '',
        nomVern: species.nomVern || '',
        groupe: species.groupe || '',
        group2: species.group2 || '',
        regne: species.regne || '',
        ordre: species.ordre || '',
        famille: species.famille || '',
        nombreObservations: totalObs,
        statutListeRouge: species.listeRouge?.['Label Statut'] || 'Non évalué',
        statutsReglementaires: species.statuts.map((s: any) => s['LABEL STATUT (statuts)']).join('; ') || 'Non réglementé',
        urlInpn: species.urlInpn || `https://inpn.mnhn.fr/espece/cd_nom/${cdRef}`
      })
    })
  } else {
    // Logique normale sans filtre par mois
    const communeCdRefs = new Set(currentCommune.observations.map((obs: any) => obs['Cd Ref']))
    
    communeCdRefs.forEach(cdRef => {
      const species = speciesData.get(cdRef)
      if (!species) return

      // Appliquer tous les filtres
      if (selectedRegne && species.regne !== selectedRegne) return
      if (filters?.selectedGroupe && species.groupe !== filters.selectedGroupe) return
      if (filters?.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
      if (filters?.selectedRedListCategory) {
        if (filters.selectedRedListCategory === 'Non évalué') {
          if (species.listeRouge) return
        } else {
          if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
        }
      }
      if (filters?.selectedOrdre && species.ordre !== filters.selectedOrdre) return
      if (filters?.selectedFamille && species.famille !== filters.selectedFamille) return
      
      if (filters?.selectedStatutReglementaire) {
        const hasStatus = species.statuts.some((statut: any) => 
          statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
        )
        if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
        if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
      }

      // Calculer le nombre total d'observations pour cette espèce dans cette commune
      let totalObs = 0
      
      currentCommune.observations.forEach((obs: any) => {
        if (obs['Cd Ref'] !== cdRef) return
        
        // Appliquer les filtres d'années
        if (filters?.anneeDebut && obs['An Obs'] < filters.anneeDebut) return
        if (filters?.anneeFin && obs['An Obs'] > filters.anneeFin) return
        
        totalObs += obs['Nb Obs']
      })

      if (totalObs > 0) {
        rows.push({
          cdRef,
          nomComplet: species.nomComplet || species.nomValide || '',
          nomVern: species.nomVern || '',
          groupe: species.groupe || '',
          group2: species.group2 || '',
          regne: species.regne || '',
          ordre: species.ordre || '',
          famille: species.famille || '',
          nombreObservations: totalObs,
          statutListeRouge: species.listeRouge?.['Label Statut'] || 'Non évalué',
          statutsReglementaires: species.statuts.map((s: any) => s['LABEL STATUT (statuts)']).join('; ') || 'Non réglementé',
          urlInpn: species.urlInpn || `https://inpn.mnhn.fr/espece/cd_nom/${cdRef}`
        })
      }
    })
  }

  // Trier par nombre d'observations décroissant
  rows.sort((a, b) => b.nombreObservations - a.nombreObservations)

  // Générer le CSV
  const headers = [
    'CD_REF',
    'Nom_scientifique',
    'Nom_vernaculaire', 
    'Groupe_1',
    'Groupe_2',
    'Regne',
    'Ordre',
    'Famille',
    'Nombre_observations',
    'Statut_liste_rouge',
    'Statuts_reglementaires',
    'URL_INPN'
  ]

  const csvContent = [
    headers.join(','),
    ...rows.map(row => [
      row.cdRef,
      `"${row.nomComplet.replace(/"/g, '""')}"`,
      `"${row.nomVern.replace(/"/g, '""')}"`,
      `"${row.groupe.replace(/"/g, '""')}"`,
      `"${row.group2.replace(/"/g, '""')}"`,
      `"${row.regne.replace(/"/g, '""')}"`,
      `"${row.ordre.replace(/"/g, '""')}"`,
      `"${row.famille.replace(/"/g, '""')}"`,
      row.nombreObservations,
      `"${row.statutListeRouge.replace(/"/g, '""')}"`,
      `"${row.statutsReglementaires.replace(/"/g, '""')}"`,
      row.urlInpn
    ].join(','))
  ].join('\n')

  // Télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  
  // Nom du fichier avec filtres appliqués
  const filterSuffix = filters.selectedRegne ? `_${filters.selectedRegne}` : ''
  const monthSuffix = filters.selectedMois ? `_${filters.selectedMois}` : ''
  link.setAttribute('download', `especes_commune_${codeInsee}${filterSuffix}${monthSuffix}.csv`)
  
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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

    // Si un filtre par mois est actif, utiliser les données phénologiques
    if (filters?.selectedMois) {
      // Compter directement depuis les données phénologiques
      currentCommune.phenologie.forEach(pheno => {
        if (pheno['Mois Obs'] !== filters.selectedMois) return
        
        const cdRef = pheno['CD REF (pheno!mois!insee)']
        const species = speciesData.get(cdRef)
        
        if (!species) return

        // Appliquer tous les autres filtres sur l'espèce
        if (selectedRegne && species.regne !== selectedRegne) return
        if (filters?.selectedGroupe && species.groupe !== filters.selectedGroupe) return
        if (filters?.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
        if (filters?.selectedRedListCategory) {
          if (filters.selectedRedListCategory === 'Non évalué') {
            // Pour "Non évalué", inclure seulement les espèces sans statut de liste rouge
            if (species.listeRouge) return
          } else {
            // Pour les autres statuts, filtrer par le statut spécifique
            if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
          }
        }
        if (filters?.selectedOrdre && species.ordre !== filters.selectedOrdre) return
        if (filters?.selectedFamille && species.famille !== filters.selectedFamille) return
        
        if (filters?.selectedStatutReglementaire) {
          const hasStatus = species.statuts.some(statut => 
            statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
          )
          if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
          if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
        }

        // Cette espèce passe tous les filtres pour ce mois
        totalObservations += pheno['Nb Donnees']
        uniqueSpecies.add(cdRef)
      })
    } else {
      // Logique normale sans filtre par mois
    currentCommune.observations.forEach(obs => {
      const cdRef = obs['Cd Ref']
      const species = speciesData.get(cdRef)
      
      if (!species) return

      // Filtrer par règne si spécifié
        if (selectedRegne && species.regne !== selectedRegne) return

      // Appliquer les filtres globaux sur les espèces
      if (filters?.selectedGroupe && species.groupe !== filters.selectedGroupe) return
      if (filters?.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
      if (filters?.selectedRedListCategory) {
        if (filters.selectedRedListCategory === 'Non évalué') {
          // Pour "Non évalué", inclure seulement les espèces sans statut de liste rouge
          if (species.listeRouge) return
        } else {
          // Pour les autres statuts, filtrer par le statut spécifique
          if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
        }
      }
      if (filters?.selectedOrdre && species.ordre !== filters.selectedOrdre) return
      if (filters?.selectedFamille && species.famille !== filters.selectedFamille) return
      
      if (filters?.selectedStatutReglementaire) {
        const hasStatus = species.statuts.some(statut => 
          statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
        )
        if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
        if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
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
  }, [currentCommune, speciesData, filters])

  if (isLoading) {
    // Essayer de récupérer le nom de la commune depuis le GeoJSON déjà chargé
    const communeName = communes?.features.find(f => f.properties.insee === codeInsee)?.properties.nom || `Code INSEE ${codeInsee}`
    
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  if (!currentCommune) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen w-full full-width-layout">
      
      {/* Contenu principal */}
      <main className="w-full full-width-layout px-6 py-8">
        
        {/* Header avec bouton retour et statistiques sur une seule ligne */}
        <div className="flex items-center gap-4 mb-8 fade-in-up">
          {/* Bouton retour à l'accueil */}
          <div className="modern-card shadow-xl">
              <button 
                onClick={() => router.push('/')}
              className="p-3 text-center min-w-[120px] hover:bg-white/10 transition-colors rounded-lg"
                title="Retour à l'accueil"
              >
              <div className="text-xl font-bold text-gradient mb-1">
                ← 
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Retour à l'accueil
              </div>
              </button>
          </div>
          
          {/* Nom de la commune et code INSEE */}
          <div className="modern-card shadow-xl flex-1">
            <div className="p-3 text-left">
              <h1 className="text-2xl font-bold mb-1">
                    <span className="text-gradient">{currentCommune.nom || `Commune ${codeInsee}`}</span>
                </h1>
              <p className="species-count-title">
                    Code INSEE: {codeInsee}
                  </p>
              </div>
            </div>
            
          {/* Observations */}
          <div className="modern-card shadow-xl">
            <div className="p-3 text-center min-w-[120px]">
              <div className="text-xl font-bold text-gradient mb-1">
                  {formatNumberFull(filteredStats.totalObs)}
                </div>
              <div className="text-gray-600 font-medium text-sm">
                      Observations
                    </div>
                  </div>
              </div>
          
          {/* Espèces */}
          <div className="modern-card shadow-xl">
            <div className="p-3 text-center min-w-[120px]">
              <div className="text-xl font-bold text-gradient mb-1">
                  {formatNumberFull(filteredStats.totalEsp)}
                </div>
              <div className="text-gray-600 font-medium text-sm">
                      Espèces
              </div>
            </div>
          </div>
          
          {/* Téléchargement CSV */}
          <div className="modern-card shadow-xl">
            <button 
              onClick={() => generateSpeciesCSV(codeInsee, speciesData, currentCommune, filters)}
              className="p-3 text-center min-w-[120px] hover:bg-white/10 transition-colors rounded-lg"
              title="Télécharger la liste des espèces en CSV"
            >
              <div className="text-xl font-bold mb-1 flex justify-center">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-green-800 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Télécharger CSV
              </div>
            </button>
          </div>
          
          {/* Comparaison */}
          <div className="modern-card shadow-xl">
            <button 
              onClick={() => router.push(`/commune/${codeInsee}/comparaison`)}
              className="p-3 text-center min-w-[120px] hover:bg-white/10 transition-colors rounded-lg"
              title="Comparer avec une autre commune"
            >
              <div className="text-xl font-bold mb-1 flex justify-center">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-green-800 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Comparaison
              </div>
            </button>
          </div>
        </div>
        
        {/* Barre de filtres */}
        <FilterBar compactPadding={true} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hover-safe w-full">
          
          {/* Groupes taxonomiques - Bubble chart */}
          <div className="container-hover-safe">
            <div className="modern-card z-middle shadow-xl fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">🦋</span>
              <span className="text-gradient">Groupes taxonomiques</span>
            </h3>
              <div className="h-80 flex-1">
              <GroupBubble codeInsee={codeInsee} />
              </div>
            </div>
          </div>

          {/* Phénologie mensuelle - Line chart */}
          <div className="container-hover-safe">
            <div className="modern-card z-middle shadow-xl fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="text-gradient">Phénologie mensuelle</span>
            </h3>
              <div className="h-80 flex-1">
              <PhenoLine codeInsee={codeInsee} />
              </div>
            </div>
          </div>

          {/* Listes rouges - Bar chart */}
          <div className="container-hover-safe">
            <div className="modern-card z-middle shadow-xl fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">🚨</span>
              <span className="text-gradient">Statuts listes rouges</span>
            </h3>
              <div className="h-80 flex-1">
              <RedListBar codeInsee={codeInsee} />
              </div>
            </div>
          </div>

          {/* Statuts réglementaires - Treemap */}
          <div className="container-hover-safe">
            <div className="modern-card z-middle shadow-xl fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <span className="text-gradient">Statuts réglementaires</span>
            </h3>
              <div className="h-80 flex-1">
              <StatusTreemap codeInsee={codeInsee} />
              </div>
            </div>
          </div>

        </div>
        
        {/* Tableau des espèces */}
        <div className="mt-8 w-full">
          <SpeciesTable codeInsee={codeInsee} />
        </div>
      </main>
    </div>
  )
} 