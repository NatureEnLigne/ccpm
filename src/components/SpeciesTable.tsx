'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatNumber } from '../utils/formatters'
import type { Taxonomie } from '../types'

interface SpeciesTableProps {
  codeInsee: string
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

export default function SpeciesTable({ codeInsee }: SpeciesTableProps) {
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

    // Récupérer tous les cd_ref des observations de cette commune
    const communeCdRefs = new Set(currentCommune.observations.map(obs => obs['Cd Ref']))
    
    console.log('📋 SpeciesTable - CD REF uniques dans commune:', {
      count: communeCdRefs.size,
      first5: Array.from(communeCdRefs).slice(0, 5)
    })

    const rows: SpeciesTableRow[] = []
    const selectedRegne = filters.selectedRegne

    // Pour chaque espèce dans cette commune
    communeCdRefs.forEach(cdRef => {
      const species = speciesData.get(cdRef)
      if (!species) return

      // Filtrer par règne si spécifié (mais pas si c'est "Tous")
      if (selectedRegne && species.regne !== selectedRegne) return

      // Appliquer les filtres du store global
      if (filters?.selectedGroupe && species.groupe !== filters.selectedGroupe) return
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

      // Calculer le nombre total d'observations pour cette espèce dans cette commune
      // en tenant compte des filtres actifs
      let totalObs = 0
      
      // Filtrer les observations selon les critères actifs
      currentCommune.observations.forEach(obs => {
        if (obs['Cd Ref'] !== cdRef) return
        
        let includeThisObs = true
        
        // Si filtre par mois actif, vérifier que cette espèce a des données phénologiques pour ce mois
        if (filters?.selectedMois) {
          const hasMonthData = currentCommune.phenologie.some(pheno => 
            pheno['CD REF (pheno!mois!insee)'] === cdRef && 
            pheno['Mois Obs'] === filters.selectedMois
          )
          if (!hasMonthData) includeThisObs = false
        }
        
        // Si filtre par année actif (bien que non encore implémenté dans l'UI, on prépare)
        if (filters?.selectedAnnee && obs['An Obs'] !== filters.selectedAnnee) {
          includeThisObs = false
        }
        
        if (includeThisObs) {
          totalObs += obs['Nb Obs']
        }
      })

      if (totalObs > 0) {
        // Récupérer les informations taxonomiques détaillées
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
    if (sortField !== field) return <span className="text-gray-400">↕️</span>
    return sortDirection === 'asc' ? <span className="text-blue-600">⬆️</span> : <span className="text-blue-600">⬇️</span>
  }

  if (!currentCommune || tableData.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          📋 Liste des espèces
        </h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p>Aucune donnée d'espèce disponible pour cette commune</p>
          {filters.selectedRegne && <p className="text-sm mt-1">Filtre: {filters.selectedRegne}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          📋 Liste des espèces
        </h3>
        <div className="text-sm text-gray-600">
          {formatNumber(tableData.length)} espèces • {formatNumber(tableData.reduce((sum, row) => sum + row.nombreObservations, 0))} observations
          {filters.selectedRegne && <span className="ml-2 text-green-600">• Filtre: {filters.selectedRegne}</span>}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50">
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 cursor-pointer hover:bg-white/20 rounded"
                  onClick={() => handleSort('group1Inpn')}
                >
                  <div className="flex items-center gap-2">
                    Groupe 1
                    <SortIcon field="group1Inpn" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 cursor-pointer hover:bg-white/20 rounded"
                  onClick={() => handleSort('group2Inpn')}
                >
                  <div className="flex items-center gap-2">
                    Groupe 2
                    <SortIcon field="group2Inpn" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 cursor-pointer hover:bg-white/20 rounded"
                  onClick={() => handleSort('nomComplet')}
                >
                  <div className="flex items-center gap-2">
                    Nom scientifique
                    <SortIcon field="nomComplet" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-700 cursor-pointer hover:bg-white/20 rounded"
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
                    Observations
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
                  <td className="py-3 px-2 text-sm">
                    <span className="font-medium text-green-700">
                      {row.group1Inpn || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-700">
                    {row.group2Inpn || '-'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span className="font-medium text-gray-800 italic">
                      {row.nomComplet || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {row.nomVern || '-'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span className="font-bold text-emerald-600">
                      {formatNumber(row.nombreObservations)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <a
                      href={row.urlInpn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 hover:bg-green-500/30 text-green-700 rounded-lg transition-colors text-sm font-medium"
                      title="Voir sur INPN"
                    >
                      🔗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/30">
          <div className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages} • 
            Affichage {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} sur {sortedData.length}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 disabled:bg-gray-200/20 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors text-sm"
            >
              ← Précédent
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
                        ? 'bg-green-500/30 text-green-700 font-medium'
                        : 'bg-white/20 hover:bg-white/30 text-gray-700'
                    }`}
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
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 