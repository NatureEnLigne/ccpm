import { isValueInFilter } from './filterHelpers'

/**
 * Génère et télécharge un fichier CSV contenant les données des espèces filtrées pour une commune
 */
export function generateSpeciesCSV(
  codeInsee: string, 
  speciesData: Map<string, any>, 
  currentCommune: any, 
  filters: any
): void {
  if (!speciesData || !currentCommune) return

  const rows: any[] = []
  const selectedRegne = filters.selectedRegne

  // Si un filtre par mois est actif, utiliser les données phénologiques
  if (filters?.selectedMois) {
    // Grouper les données phénologiques par CD REF pour ce mois
    const monthSpeciesData = new Map<string, number>()
    
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

    currentCommune.phenologie.forEach((pheno: any) => {
      if (!isValueInFilter(selectedMonthNumbers, pheno['Mois Obs'])) return
      
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
      const species = speciesData.get(String(cdRef))
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
      const moisNames = filters.selectedMois.map((mois: any) => {
        const monthIndex = typeof mois === 'number' ? mois - 1 : 0
        return moisNoms[monthIndex] || moisNoms[0]
      }).join('-')
      filterParts.push(`mois:${moisNames}`)
    } else {
      const monthIndex = typeof filters.selectedMois === 'number' ? filters.selectedMois - 1 : 0
      filterParts.push(`mois:${moisNoms[monthIndex] || moisNoms[0]}`)
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