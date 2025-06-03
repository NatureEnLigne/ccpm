'use client'

import { useEffect, useState } from 'react'
import { ResponsiveCirclePacking } from '@nivo/circle-packing'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'

interface GroupBubbleProps {
  codeInsee: string
}

interface BubbleData {
  id: string
  value: number
  children?: BubbleData[]
}

export default function GroupBubble({ codeInsee }: GroupBubbleProps) {
  const { communeData, speciesData, filters } = useAppStore()
  const { handleChartClick, handleChartHover, isFiltered, isHovered } = useChartInteractions()
  const [data, setData] = useState<BubbleData | null>(null)

  useEffect(() => {
    if (communeData && speciesData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      // Compter les observations par groupe taxonomique
      const groupStats = new Map<string, number>()
      const selectedRegne = filters.selectedRegne
      
      commune.observations.forEach(obs => {
        const cdRef = obs['Cd Ref']
        const species = speciesData.get(cdRef)
        
        if (species) {
          // Filtrer par règne si nécessaire
          if (selectedRegne && species.regne !== selectedRegne) {
            return // Ignorer cette espèce
          }
          
          // Appliquer les filtres du store global
          if (filters.selectedMois) {
            // Vérifier si cette observation a des données pour le mois sélectionné
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
          
          const groupe = species.groupe || 'Inconnu'
          const current = groupStats.get(groupe) || 0
          groupStats.set(groupe, current + obs['Nb Obs'])
        }
      })

      // Convertir en format pour Nivo CirclePacking
      const children: BubbleData[] = Array.from(groupStats.entries()).map(([groupe, count]) => ({
        id: groupe,
        value: count
      }))

      // Trier par valeur décroissante
      children.sort((a, b) => b.value - a.value)

      const bubbleData: BubbleData = {
        id: 'Groupes taxonomiques',
        value: 0, // Non utilisé pour le root
        children
      }

      setData(bubbleData)
      console.log('🦋 Données bubble pour', codeInsee, 'règne:', selectedRegne, 'filtres appliqués:', filters, ':', bubbleData)
    }
  }, [communeData, speciesData, codeInsee, filters])

  if (!data || !data.children || data.children.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveCirclePacking
      data={data}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      id="id"
      value="value"
      colors={['#2D5016', '#228B22', '#32CD32', '#90EE90', '#98FB98', '#F0FFF0', '#8FBC8F', '#006400', '#556B2F', '#9ACD32']}
      padding={4}
      enableLabels={true}
      labelsSkipRadius={10}
      labelsFilter={(label) => label.node.id !== 'root' && label.node.id !== 'Groupes taxonomiques'}
      labelTextColor={{
        from: 'color',
        modifiers: [
          ['darker', 2]
        ]
      }}
      borderWidth={2}
      borderColor={{
        from: 'color',
        modifiers: [
          ['darker', 0.3]
        ]
      }}
      animate={true}
      motionConfig="gentle"
      tooltip={({ id, value }) => {
        // Filtrer la valeur "root" qui correspond au nœud racine de la hiérarchie
        if (id === 'root' || id === 'Groupes taxonomiques') return <div></div>
        
        const isCurrentFiltered = isFiltered('bubble', 'group', id)
        
        return (
          <div className="glass rounded-lg p-3 text-sm">
            <div className="font-medium flex items-center gap-2">
              <span className="font-medium">{id}</span>
              {isFiltered('bubble', 'group', id) && (
                <span className="text-green-600 text-xs">• Filtré</span>
              )}
            </div>
            <div className="text-gray-600">
              {value} espèces
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Cliquez pour filtrer par groupe
            </div>
          </div>
        )
      }}
      onClick={(node) => {
        // Filtrer la valeur "root" pour éviter qu'elle devienne un filtre
        if (node.id === 'root' || node.id === 'Groupes taxonomiques') return
        handleChartClick({
          chartType: 'bubble',
          dataKey: 'group',
          value: node.id as string,
          action: 'click'
        })
      }}
      onMouseEnter={(node) => {
        // Filtrer la valeur "root" 
        if (node.id === 'root' || node.id === 'Groupes taxonomiques') return
        handleChartHover({
          chartType: 'bubble',
          dataKey: 'group',
          value: node.id as string,
          action: 'hover'
        })
      }}
      onMouseLeave={() => {
        handleChartHover(null)
      }}
    />
  )
} 