'use client'

import { useEffect, useState } from 'react'
import { ResponsiveTreeMap } from '@nivo/treemap'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'

interface StatusTreemapProps {
  codeInsee: string
  selectedRegne: string
}

interface TreemapData {
  id: string
  value: number
  children?: TreemapData[]
}

export default function StatusTreemap({ codeInsee, selectedRegne }: StatusTreemapProps) {
  const { communeData, speciesData } = useAppStore()
  const { handleChartClick, handleChartHover, isFiltered, filters } = useChartInteractions()
  const [data, setData] = useState<TreemapData | null>(null)

  useEffect(() => {
    if (communeData && speciesData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      // Compter les espèces par statut réglementaire
      const statusStats = new Map<string, number>()
      const processedSpecies = new Set<string>()

      commune.observations.forEach(obs => {
        const cdRef = obs['Cd Ref']
        
        // Éviter de compter la même espèce plusieurs fois
        if (processedSpecies.has(cdRef)) return
        processedSpecies.add(cdRef)

        const species = speciesData.get(cdRef)
        if (species) {
          // Filtrer par règne si nécessaire
          if (selectedRegne !== 'Tous' && species.regne !== selectedRegne) {
            return // Ignorer cette espèce
          }
          
          // Appliquer les filtres du store global
          if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) {
            return
          }
          
          if (filters.selectedMois) {
            // Vérifier si cette espèce a des données pour le mois sélectionné
            const hasMonthData = commune.phenologie.some(pheno => 
              pheno['CD REF (pheno!mois!insee)'] === cdRef && 
              pheno['Mois Obs'] === filters.selectedMois
            )
            if (!hasMonthData) return
          }
          
          if (filters.selectedRedListCategory) {
            if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) {
              return
            }
          }
          
          if (filters.selectedOrdre && species.ordre !== filters.selectedOrdre) {
            return
          }
          
          if (filters.selectedFamille && species.famille !== filters.selectedFamille) {
            return
          }
          
          if (filters.selectedStatutReglementaire) {
            // Vérifier si l'espèce a ce statut réglementaire
            const hasStatus = species.statuts.some(statut => 
              statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
            )
            if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') {
              return
            }
            if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) {
              return
            }
          }
          
          if (species.statuts.length > 0) {
            species.statuts.forEach(statut => {
              const statutText = statut['LABEL STATUT (statuts)'] || 'Non réglementé'
              const current = statusStats.get(statutText) || 0
              statusStats.set(statutText, current + 1)
            })
          } else {
            const current = statusStats.get('Non réglementé') || 0
            statusStats.set('Non réglementé', current + 1)
          }
        }
      })

      // Convertir en format pour Nivo Treemap
      const children: TreemapData[] = Array.from(statusStats.entries()).map(([statut, count]) => ({
        id: statut || 'Non réglementé',
        value: count
      }))

      // Trier par valeur décroissante
      children.sort((a, b) => b.value - a.value)

      const treemapData: TreemapData = {
        id: 'root',
        value: 0, // Non utilisé pour le root
        children
      }

      setData(treemapData)
      console.log('⚖️ Données statuts pour', codeInsee, 'règne:', selectedRegne, 'filtres appliqués:', filters, ':', treemapData)
    }
  }, [communeData, speciesData, codeInsee, selectedRegne, filters])

  if (!data || !data.children || data.children.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">⚖️</div>
          <p>Aucune donnée de statut réglementaire disponible</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveTreeMap
      data={data}
      identity="id"
      value="value"
      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      labelSkipSize={12}
      labelTextColor={{
        from: 'color',
        modifiers: [
          ['darker', 1.2]
        ]
      }}
      parentLabelPosition="left"
      parentLabelTextColor={{
        from: 'color',
        modifiers: [
          ['darker', 2]
        ]
      }}
      borderColor={{
        from: 'color',
        modifiers: [
          ['darker', 0.1]
        ]
      }}
      colors={['#8FBC8F', '#90EE90', '#98FB98', '#32CD32', '#228B22', '#006400', '#2E8B57', '#3CB371', '#20B2AA', '#66CDAA']}
      animate={true}
      motionConfig="gentle"
      onClick={(node) => {
        if (node.id !== 'root') {
          handleChartClick({
            chartType: 'treemap',
            dataKey: 'status',
            value: node.id as string,
            action: 'click'
          })
        }
      }}
      onMouseEnter={(node) => {
        if (node.id !== 'root') {
          handleChartHover({
            chartType: 'treemap',
            dataKey: 'status',
            value: node.id as string,
            action: 'hover'
          })
        }
      }}
      onMouseLeave={() => {
        handleChartHover(null)
      }}
      tooltip={({ node }) => {
        const isCurrentFiltered = isFiltered('treemap', 'status', node.id as string)
        
        return (
          <div className="glass rounded-lg p-3 text-sm">
            <div className="font-medium flex items-center gap-2">
              {node.id}
              {isCurrentFiltered && (
                <span className="text-green-600 text-xs">• Filtré</span>
              )}
            </div>
            <div className="text-gray-600 mt-1">
              {node.value} espèce{node.value > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Cliquez pour filtrer par statut
            </div>
          </div>
        )
      }}
    />
  )
} 