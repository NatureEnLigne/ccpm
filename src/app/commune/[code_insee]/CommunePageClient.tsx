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
import { isValueInFilter } from '../../../utils/filterHelpers'
import GroupBubble from '../../../components/dashboards/GroupBubble'
import PhenoLine from '../../../components/dashboards/PhenoLine'
import RedListBar from '../../../components/dashboards/RedListBar'
import StatusTreemap from '../../../components/dashboards/StatusTreemap'
import FilterBar from '../../../components/FilterBar'
import SpeciesTable from '../../../components/SpeciesTable'
import NoDataAnimation from '../../../components/NoDataAnimation'


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
      if (!isValueInFilter(filters.selectedMois, pheno['Mois Obs'])) return
      
      const cdRef = pheno['CD REF (pheno!mois!insee)']
      const species = speciesData.get(cdRef)
      if (!species) return

      // Appliquer tous les filtres sur l'espèce
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
  
  // Créer le nom du fichier avec le nom de la commune et les filtres
  const communeName = currentCommune.nom || `Commune-${codeInsee}`
  const sanitizedCommuneName = communeName.replace(/[^a-zA-Z0-9\-]/g, '-')
  
  const filterParts: string[] = []
  
  // Fonction pour nettoyer les chaînes de caractères
  const sanitizeString = (str: string) => 
    str.toLowerCase()
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ùûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '')
  
  // Ajouter le filtre par règne (🌿 Règne)
  if (filters.selectedRegne) {
    filterParts.push(`regne:${sanitizeString(filters.selectedRegne)}`)
  }
  
  // Ajouter les filtres d'années (📅 Années)
  if (filters.anneeDebut || filters.anneeFin) {
    if (filters.anneeDebut && filters.anneeFin) {
      if (filters.anneeDebut === filters.anneeFin) {
        filterParts.push(`annee:${filters.anneeDebut}`)
      } else {
        filterParts.push(`annees:${filters.anneeDebut}-${filters.anneeFin}`)
      }
    } else if (filters.anneeDebut) {
      filterParts.push(`apartirde:${filters.anneeDebut}`)
    } else if (filters.anneeFin) {
      filterParts.push(`jusqua:${filters.anneeFin}`)
    }
  }
  
  // Ajouter le filtre par groupe taxonomique (🦋 Groupes taxonomiques)
  if (filters.selectedGroupe) {
    if (Array.isArray(filters.selectedGroupe)) {
      const groupNames = filters.selectedGroupe.map(sanitizeString).join('-')
      filterParts.push(`groupe:${groupNames}`)
    } else {
      filterParts.push(`groupe:${sanitizeString(filters.selectedGroupe)}`)
    }
  }
  
  // Ajouter le filtre par mois (📅 Phénologie mensuelle)
  if (filters.selectedMois) {
    const moisNoms = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ]
    
    if (Array.isArray(filters.selectedMois)) {
      const moisNames = filters.selectedMois.map((mois: number) => moisNoms[mois - 1]).join('-')
      filterParts.push(`mois:${moisNames}`)
    } else {
      filterParts.push(`mois:${moisNoms[filters.selectedMois - 1]}`)
    }
  }
  
  // Ajouter le filtre par statut liste rouge (🚨 Statuts listes rouges)
  if (filters.selectedRedListCategory) {
    if (Array.isArray(filters.selectedRedListCategory)) {
      const statusNames = filters.selectedRedListCategory.map(sanitizeString).join('-')
      filterParts.push(`liste-rouge:${statusNames}`)
    } else {
      filterParts.push(`liste-rouge:${sanitizeString(filters.selectedRedListCategory)}`)
    }
  }
  
  // Ajouter le filtre par statut réglementaire (⚖️ Statuts réglementaires)
  if (filters.selectedStatutReglementaire) {
    if (Array.isArray(filters.selectedStatutReglementaire)) {
      const statusNames = filters.selectedStatutReglementaire.map(sanitizeString).join('-')
      filterParts.push(`statut-reglementaire:${statusNames}`)
    } else {
      filterParts.push(`statut-reglementaire:${sanitizeString(filters.selectedStatutReglementaire)}`)
    }
  }
  
  // Construire le nom final du fichier
  const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : ''
  const fileName = `${sanitizedCommuneName}${filterSuffix}.csv`
  
  link.setAttribute('download', fileName)
  
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
    resetFiltersOnCommuneChange,
    resetMapView,
    setSelectedCommune,
    setFilter,
    clearFilters,
    setLoading
  } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  // Fonction pour retourner à l'accueil avec réinitialisation
  const handleReturnHome = () => {
    resetMapView() // Désélectionne la commune et revient à l'emprise CCPM
    router.push('/') // Navigate vers l'accueil
  }
  
  // Réinitialiser les filtres à chaque changement de commune
  useEffect(() => {
    console.log('🔄 Changement de commune détecté:', codeInsee)
    resetFiltersOnCommuneChange()
  }, [codeInsee, resetFiltersOnCommuneChange])

  useEffect(() => {
    loadAllData()
  }, [])

  // Appliquer les filtres depuis l'URL au chargement de la page
  useEffect(() => {
    const applyFiltersFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search)
      
      // Noms des mois pour la conversion
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]
      
      // Parcourir tous les paramètres URL et appliquer les filtres correspondants
      urlParams.forEach((value, key) => {
        if (value && key !== 'activeFilters') {
          let filterValue: any = value
          
          // Gérer les filtres multiples (séparés par des virgules)
          if (value.includes(',')) {
            filterValue = value.split(',')
            
            // Conversion spéciale pour les mois (convertir numéros en noms)
            if (key === 'selectedMois') {
              filterValue = filterValue.map((monthNum: string) => {
                const num = parseInt(monthNum.trim(), 10)
                return (num >= 1 && num <= 12) ? monthNames[num - 1] : monthNum
              })
            }
          }
          // Gérer les nombres
          else if (key === 'anneeDebut' || key === 'anneeFin') {
            filterValue = parseInt(value, 10)
            if (isNaN(filterValue)) return
          }
          // Conversion pour un seul mois
          else if (key === 'selectedMois') {
            const num = parseInt(value.trim(), 10)
            filterValue = (num >= 1 && num <= 12) ? monthNames[num - 1] : value
          }
          
          // Appliquer le filtre
          console.log(`🔧 Filtre appliqué depuis URL: ${key} =`, filterValue)
          setFilter(key as any, filterValue, 'URL')
        }
      })
    }

    // Appliquer les filtres seulement si les données sont chargées
    if (!isLoading && communeData && speciesData) {
      applyFiltersFromURL()
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
      // Compter directement depuis les données phénologiques
      currentCommune.phenologie.forEach(pheno => {
        if (!isValueInFilter(filters.selectedMois, pheno['Mois Obs'])) return
        
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

  // Fonction pour générer le lien de partage avec les filtres actuels
  const generateShareLink = () => {
    const baseUrl = window.location.origin
    const currentPath = `/commune/${codeInsee}`
    const searchParams = new URLSearchParams()

    // Noms des mois pour la conversion
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    // Ajouter tous les filtres actifs aux paramètres de l'URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && key !== 'activeFilters') {
        if (Array.isArray(value)) {
          // Conversion spéciale pour les mois (convertir noms en numéros)
          if (key === 'selectedMois') {
            const monthNumbers = value.map((monthName: string) => {
              const index = monthNames.indexOf(monthName)
              return index !== -1 ? (index + 1).toString() : monthName
            })
            searchParams.set(key, monthNumbers.join(','))
          } else {
            // Pour les autres filtres multiples, joindre par des virgules
            searchParams.set(key, value.join(','))
          }
        } else {
          // Conversion pour un seul mois
          if (key === 'selectedMois') {
            const index = monthNames.indexOf(value as string)
            const monthValue = index !== -1 ? (index + 1).toString() : value
            searchParams.set(key, String(monthValue))
          } else {
            searchParams.set(key, String(value))
          }
        }
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `${baseUrl}${currentPath}?${queryString}` : `${baseUrl}${currentPath}`
  }

  // Fonction pour copier le lien de partage
  const handleShareLink = async () => {
    try {
      const shareLink = generateShareLink()
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      
      // Réinitialiser l'état après 3 secondes
      setTimeout(() => {
        setLinkCopied(false)
      }, 3000)
    } catch (err) {
      console.error('Erreur lors de la copie du lien:', err)
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const shareLink = generateShareLink()
      prompt('Copiez ce lien:', shareLink)
    }
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
        
        {/* Header avec bouton retour et statistiques - responsive */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 fade-in-up">
          {/* Première rangée : Bouton retour et nom de la commune */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
            {/* Bouton retour à l'accueil */}
            <div className="modern-card shadow-xl">
                <button 
                  onClick={handleReturnHome}
                className="p-3 text-center w-full sm:min-w-[120px] hover:bg-white/10 transition-colors rounded-lg"
                  title="Retour à l'accueil"
                >
                <div className="text-3xl font-bold text-gradient mb-1">
                  ← 
                </div>
                <div className="nav-button-label">
                  Retour à l'accueil
                </div>
                </button>
            </div>
            
            {/* Nom de la commune et code INSEE */}
            <div className="modern-card shadow-xl flex-1">
              <div className="p-3 text-left">
                <h1 className="text-xl sm:text-2xl font-bold mb-1">
                      <span className="text-gradient">{currentCommune.nom || `Commune ${codeInsee}`}</span>
                  </h1>
                <p className="species-count-title">
                      INSEE : {codeInsee}
                    </p>
                </div>
              </div>
          </div>
          
          {/* Deuxième rangée : Statistiques et actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
            {/* Cadre statistiques regroupées */}
            <div className="modern-card shadow-xl">
              <div className="flex divide-x divide-white/20">
                {/* Observations */}
                <div className="p-3 text-center flex-1 min-w-[120px]">
                  <div className="text-xl font-bold text-gradient mb-1">
                    {formatNumberFull(filteredStats.totalObs)}
                  </div>
                  <div className="data-label-unified">
                    Observations
                  </div>
                </div>
                
                {/* Espèces */}
                <div className="p-3 text-center flex-1 min-w-[120px]">
                  <div className="text-xl font-bold text-gradient mb-1">
                    {formatNumberFull(filteredStats.totalEsp)}
                  </div>
                  <div className="data-label-unified">
                    Espèces
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cadre actions regroupées */}
            <div className="modern-card shadow-xl">
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/20">
                {/* Téléchargement CSV */}
                <button 
                  onClick={() => generateSpeciesCSV(codeInsee, speciesData, currentCommune, filters)}
                  className="p-3 text-center flex-1 hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg sm:first:rounded-l-lg sm:last:rounded-r-lg sm:first:rounded-t-lg sm:last:rounded-t-lg"
                  title="Télécharger la liste des espèces en CSV"
                >
                  <div className="text-lg font-bold mb-1 flex justify-center">
                    <div className="w-5 h-5 bg-gradient-to-br from-amber-600 to-green-800 rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="data-label-unified text-xs">
                    Télécharger
                  </div>
                </button>
                
                {/* Comparaison */}
                <button 
                  onClick={() => router.push(`/commune/${codeInsee}/comparaison`)}
                  className="p-3 text-center flex-1 hover:bg-white/10 transition-colors"
                  title="Comparer avec une autre commune"
                >
                  <div className="text-lg font-bold mb-1 flex justify-center">
                    <div className="w-5 h-5 bg-gradient-to-br from-amber-600 to-green-800 rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM11 4a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="data-label-unified text-xs">
                    Comparaison
                  </div>
                </button>
                
                {/* Partage de lien */}
                <button 
                  onClick={handleShareLink}
                  className="p-3 text-center flex-1 hover:bg-white/10 transition-colors"
                  title="Partager le lien avec les filtres actuels"
                >
                  <div className="text-lg font-bold mb-1 flex justify-center">
                    <div className="w-5 h-5 bg-gradient-to-br from-amber-600 to-green-800 rounded flex items-center justify-center">
                      {linkCopied ? (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="data-label-unified text-xs">
                    {linkCopied ? 'Copié !' : 'Partager'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Barre de filtres */}
        <FilterBar compactPadding={true} noBottomMargin={true} />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 overflow-hover-safe w-full mt-6">
          
          {/* Groupes taxonomiques - Bubble chart */}
          <div className="container-hover-safe">
            <div className="modern-card z-middle shadow-xl fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">🦋</span>
              <span className="text-gradient">Groupes taxonomiques</span>
            </h3>
              <div className="h-64 sm:h-80 flex-1">
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
              <div className="h-64 sm:h-80 flex-1">
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
              <div className="h-64 sm:h-80 flex-1">
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
              <div className="h-64 sm:h-80 flex-1">
              <StatusTreemap codeInsee={codeInsee} />
              </div>
            </div>
          </div>

        </div>
        
        {/* Tableau des espèces */}
        <div className="mt-6 w-full">
          <SpeciesTable codeInsee={codeInsee} />
        </div>
      </main>
    </div>
  )
} 