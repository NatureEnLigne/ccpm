'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatNumber, translateRegne } from '../utils/formatters'
import { isValueInFilter } from '../utils/filterHelpers'
import type { Taxonomie } from '../types'
import NoDataAnimation from '@/components/NoDataAnimation'

interface SpeciesTableProps {
  codeInsee: string
  noCard?: boolean
}

interface SpeciesTableRow {
  cdRef: string
  group1Inpn: string
  group2Inpn: string
  nomComplet: string
  nomVern: string
  urlInpn: string
  nombreObservations: number
}

export default function SpeciesTable({ codeInsee, noCard = false }: SpeciesTableProps) {
  const { speciesData, communeData, filters } = useAppStore()
  const [sortField, setSortField] = useState<keyof SpeciesTableRow>('nombreObservations')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Récupérer les données de la commune pour filtrer les espèces
  const currentCommune = communeData?.get(codeInsee)

  const tableData = useMemo(() => {
    if (!speciesData || !currentCommune) {
      console.log('📋 SpeciesTable - Données manquantes:', { 
        hasSpeciesData: !!speciesData, 
        hasCurrentCommune: !!currentCommune,
        codeInsee 
      })
      return []
    }

    console.log('📋 SpeciesTable - Données disponibles:', {
      codeInsee,
      selectedRegne: filters.selectedRegne,
      speciesDataSize: speciesData.size,
      communeObservations: currentCommune.observations.length
    })

    const rows: SpeciesTableRow[] = []
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

      currentCommune.phenologie.forEach(pheno => {
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

      // Créer les lignes du tableau avec les données du mois filtré
      monthSpeciesData.forEach((totalObs, cdRef) => {
        const species = speciesData.get(cdRef)
        if (!species || totalObs === 0) return

        rows.push({
          cdRef,
          group1Inpn: species.groupe || '',
          group2Inpn: species.group2 || '',
          nomComplet: species.nomComplet || species.nomValide || '',
          nomVern: species.nomVern || '',
          urlInpn: species.urlInpn || `https://inpn.mnhn.fr/espece/cd_nom/${cdRef}`,
          nombreObservations: totalObs
        })
      })
    } else {
      // Logique normale sans filtre par mois
    // Récupérer tous les cd_ref des observations de cette commune
    const communeCdRefs = new Set(currentCommune.observations.map(obs => obs['Cd Ref']))
    
    console.log('📋 SpeciesTable - CD REF uniques dans commune:', {
      count: communeCdRefs.size,
      first5: Array.from(communeCdRefs).slice(0, 5)
    })

    // Pour chaque espèce dans cette commune
    communeCdRefs.forEach(cdRef => {
      const species = speciesData.get(cdRef)
      if (!species) return

      // Filtrer par règne si spécifié (mais pas si c'est "Tous")
      if (selectedRegne && species.regne !== selectedRegne) return

      // Appliquer les filtres du store global
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
      
      currentCommune.observations.forEach(obs => {
        if (obs['Cd Ref'] !== cdRef) return
        
        // Appliquer les filtres d'années
        if (filters?.anneeDebut && obs['An Obs'] < filters.anneeDebut) return
        if (filters?.anneeFin && obs['An Obs'] > filters.anneeFin) return
        
          totalObs += obs['Nb Obs']
      })

      if (totalObs > 0) {
        rows.push({
          cdRef,
          group1Inpn: species.groupe || '',
          group2Inpn: species.group2 || '',
          nomComplet: species.nomComplet || species.nomValide || '',
          nomVern: species.nomVern || '',
          urlInpn: species.urlInpn || `https://inpn.mnhn.fr/espece/cd_nom/${cdRef}`,
          nombreObservations: totalObs
        })
      }
    })
    }

    console.log('📋 SpeciesTable - Lignes générées:', {
      totalRows: rows.length,
      firstRow: rows[0],
      filtersApplied: filters
    })

    return rows
  }, [speciesData, currentCommune, codeInsee, filters])

  // Tri des données
  const sortedData = useMemo(() => {
    const sorted = [...tableData].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
    
    return sorted
  }, [tableData, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  // Générer une couleur basée sur le nombre d'observations (marron pour les plus grands, vert pour les plus petits)
  const getObservationColor = (count: number, maxCount: number): string => {
    if (maxCount === 0) return '#2d5016' // Vert par défaut
    
    const ratio = count / maxCount
    const startColor = { r: 205, g: 133, b: 63 }   // #cd853f (marron doré) - pour les plus grandes valeurs
    const endColor = { r: 45, g: 80, b: 22 }       // #2d5016 (vert foncé) - pour les plus petites valeurs
    
    const r = Math.round(startColor.r + (endColor.r - startColor.r) * (1 - ratio))
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * (1 - ratio))
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * (1 - ratio))
    
    return `rgb(${r}, ${g}, ${b})`
  }

  const maxObservations = Math.max(...tableData.map(row => row.nombreObservations), 1)

  const handleSort = (field: keyof SpeciesTableRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: keyof SpeciesTableRow }) => {
    const isActive = sortField === field
    
    if (!isActive) {
      return (
        <div 
          className="inline-flex items-center justify-center w-6 h-6 rounded transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(205, 133, 63, 0.2)'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <defs>
              <linearGradient id="sort-inactive" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cd853f" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#2d5016" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path 
              d="M11 3L7 7h8L11 3z" 
              fill="url(#sort-inactive)"
            />
            <path 
              d="M11 19L7 15h8l-4 4z" 
              fill="url(#sort-inactive)"
            />
          </svg>
        </div>
      )
    }
    
    return (
      <div 
        className="inline-flex items-center justify-center w-6 h-6 rounded transition-all duration-300 shadow-md"
        style={{
          background: 'linear-gradient(45deg, #cd853f, #2d5016)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          opacity: 0.9
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <defs>
            <linearGradient id="sort-active" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f0f0f0" />
            </linearGradient>
          </defs>
          {sortDirection === 'asc' ? (
            <path 
              d="M11 3L7 7h8L11 3z" 
              fill="url(#sort-active)"
            />
          ) : (
            <path 
              d="M11 19L7 15h8l-4 4z" 
              fill="url(#sort-active)"
            />
          )}
        </svg>
      </div>
    )
  }

  if (!currentCommune || tableData.length === 0) {
    const content = (
      <>
        {!noCard && (
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          <span className="text-gradient">Liste des espèces</span>
        </h3>
        )}
        <div className="py-8">
          <NoDataAnimation message="Aucune donnée d'espèce disponible pour cette commune" />
        </div>
      </>
    )

    return noCard ? (
      <div className="fade-in-up">{content}</div>
    ) : (
      <div className="modern-card z-bottom shadow-xl fade-in-up">{content}</div>
    )
  }

  const mainContent = (
    <>
      <div className="flex justify-between items-center mb-6">
        {!noCard && (
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-xl">📋</span>
          <span className="text-gradient">Liste des espèces</span>
        </h3>
        )}
        <div className={`species-count-title ${noCard ? 'w-full text-center' : ''}`}>
          {formatNumber(tableData.length)} espèces • {formatNumber(tableData.reduce((sum, row) => sum + row.nombreObservations, 0))} observations
          {filters.selectedRegne && <span className="ml-2 text-green-600">• Filtre: {translateRegne(filters.selectedRegne)}</span>}
        </div>
      </div>

      {/* Tableau responsive */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50">
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 cursor-pointer hover:bg-white/20 rounded hidden sm:table-cell"
                  onClick={() => handleSort('group2Inpn')}
                >
                  <div className="flex items-center gap-2">
                    Groupe
                    <SortIcon field="group2Inpn" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 cursor-pointer hover:bg-white/20 rounded"
                  onClick={() => handleSort('nomComplet')}
                >
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline">Nom scientifique</span>
                    <span className="md:hidden">Espèce</span>
                    <SortIcon field="nomComplet" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 cursor-pointer hover:bg-white/20 rounded hidden lg:table-cell"
                  onClick={() => handleSort('nomVern')}
                >
                  <div className="flex items-center gap-2">
                    Nom vernaculaire
                    <SortIcon field="nomVern" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 cursor-pointer hover:bg-white/20 rounded"
                  onClick={() => handleSort('nombreObservations')}
                >
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">Observations</span>
                    <span className="sm:hidden">Obs.</span>
                    <SortIcon field="nombreObservations" />
                  </div>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-700 w-20">
                  INPN
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr 
                  key={row.cdRef}
                  className={`border-b border-gray-100/30 hover:bg-white/10 transition-colors ${
                    index % 2 === 0 ? 'bg-white/5' : ''
                  }`}
                >
                  <td className="py-3 px-2 text-sm text-gray-700 hidden sm:table-cell">
                    {row.group2Inpn || '-'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <div>
                      <div className="font-medium text-gray-800 italic">
                        {row.nomComplet || '-'}
                      </div>
                      {/* Afficher le groupe sur mobile */}
                      <div className="text-xs text-gray-500 mt-1 sm:hidden">
                        {row.group2Inpn || '-'}
                      </div>
                      {/* Afficher le nom vernaculaire sur tablette */}
                      {row.nomVern && (
                        <div className="text-xs text-gray-600 mt-1 lg:hidden">
                          {row.nomVern}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600 hidden lg:table-cell">
                    {row.nomVern || '-'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span 
                      className="font-bold"
                      style={{ color: getObservationColor(row.nombreObservations, maxObservations) }}
                    >
                      {formatNumber(row.nombreObservations)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <a
                      href={row.urlInpn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-sm font-medium text-white"
                      style={{ 
                        backgroundColor: getObservationColor(row.nombreObservations, maxObservations),
                        opacity: 0.8 
                      }}
                      title="Voir sur INPN"
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination responsive */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-gray-200/30">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            Page {currentPage} sur {totalPages} • 
            Affichage {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} sur {sortedData.length}
          </div>
          
          <div className="flex gap-2 justify-center sm:justify-end">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 disabled:bg-gray-200/20 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <span className="hidden sm:inline">← Précédent</span>
              <span className="sm:hidden">←</span>
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                      currentPage === pageNum
                        ? 'text-white font-medium shadow-md'
                        : 'bg-white/20 hover:bg-white/30 text-gray-700'
                    }`}
                    style={currentPage === pageNum ? {
                      background: 'linear-gradient(45deg, #cd853f, #2d5016)',
                      opacity: 0.9
                    } : {}}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 disabled:bg-gray-200/20 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <span className="hidden sm:inline">Suivant →</span>
              <span className="sm:hidden">→</span>
            </button>
          </div>
        </div>
      )}
    </>
  )

  return noCard ? (
    <div className="fade-in-up">{mainContent}</div>
  ) : (
    <div className="modern-card z-bottom shadow-xl fade-in-up">{mainContent}</div>
  )
} 