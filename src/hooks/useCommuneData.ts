import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { 
  loadSyntheseInsee,
  loadPhenoMoisInsee,
  loadTaxonomie,
  loadListesRouges,
  loadStatuts
} from '../utils/csvLoader'
import { joinCommuneData, joinSpeciesData, enrichCommuneDataWithNames } from '../utils/dataJoiner'
import { loadCommunesGeoJSON } from '../utils/geojsonLoader'
import { isValueInFilter } from '../utils/filterHelpers'
import { applyFiltersFromURL } from '../utils/urlUtils'
import type { SyntheseInsee, PhenoMoisInsee, Taxonomie, ListeRouge, Statut } from '../types'

export function useCommuneData(codeInsee: string) {
  const { 
    communeData, 
    setCommuneData, 
    speciesData, 
    setSpeciesData, 
    communes, 
    setCommunes,
    filters,
    resetFiltersOnCommuneChange,
    setFilter
  } = useAppStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Réinitialiser les filtres à chaque changement de commune
  useEffect(() => {
    console.log('🔄 Changement de commune détecté:', codeInsee)
    resetFiltersOnCommuneChange()
  }, [codeInsee, resetFiltersOnCommuneChange])

  // Charger toutes les données
  useEffect(() => {
    loadAllData()
  }, [])

  // Appliquer les filtres depuis l'URL au chargement de la page
  useEffect(() => {
    // Appliquer les filtres seulement si les données sont chargées
    if (!isLoading && communeData && speciesData) {
      applyFiltersFromURL(setFilter)
    }
  }, [setFilter, isLoading, communeData, speciesData])

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

    // Éviter le calcul prématuré si les filtres URL ne sont pas encore appliqués
    const hasUrlParams = new URLSearchParams(window.location.search).size > 0
    const hasAppliedFilters = Object.values(filters).some(value => value !== null && value !== undefined)
    
    if (hasUrlParams && !hasAppliedFilters) {
      console.log('⏳ Calcul des statistiques différé - En attente des filtres URL')
      return { totalObs: 0, totalEsp: 0 }
    }

    console.log('📊 Calcul des statistiques avec filtres:', filters)

    let totalObservations = 0
    const uniqueSpecies = new Set<string>()
    const selectedRegne = filters.selectedRegne

    // Si un filtre par mois est actif, utiliser les données phénologiques
    if (filters?.selectedMois) {
      // Noms des mois pour la conversion
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]
      
      // Convertir les noms de mois en numéros pour la comparaison
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
      
      console.log('🗓️ Filtrage par mois:', { 
        selectedMois: filters.selectedMois, 
        selectedMonthNumbers,
        type: typeof filters.selectedMois 
      })
      
      // Compter directement depuis les données phénologiques
      currentCommune.phenologie.forEach((pheno: any) => {
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
      currentCommune.observations.forEach((obs: any) => {
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
  }, [currentCommune, speciesData, filters])

  return {
    isLoading,
    error,
    currentCommune,
    communeGeoJSON,
    filteredStats,
    speciesData,
    filters
  }
} 