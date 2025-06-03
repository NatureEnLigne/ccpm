'use client'

import { useEffect, useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'

interface RedListBarProps {
  codeInsee: string
}

interface BarData {
  [key: string]: string | number
}

export default function RedListBar({ codeInsee }: RedListBarProps) {
  const { communeData, speciesData, filters } = useAppStore()
  const { handleChartClick, handleChartHover, isFiltered } = useChartInteractions()
  const [data, setData] = useState<BarData[]>([])

  useEffect(() => {
    if (communeData && speciesData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      // Compter les espèces par statut liste rouge
      const statusStats = new Map<string, number>()
      const processedSpecies = new Set<string>()
      const selectedRegne = filters.selectedRegne

      commune.observations.forEach(obs => {
        const cdRef = obs['Cd Ref']
        
        // Éviter de compter la même espèce plusieurs fois
        if (processedSpecies.has(cdRef)) return
        processedSpecies.add(cdRef)

        const species = speciesData.get(cdRef)
        if (species) {
          // Filtrer par règne si nécessaire
          if (selectedRegne && species.regne !== selectedRegne) {
            return // Ignorer cette espèce
          }
          
          // Appliquer les filtres du store global
          if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) {
            return
          }
          
          if (filters.selectedGroup2 && species.group2 !== filters.selectedGroup2) {
            return
          }
          
          if (filters.selectedMois) {
            // Vérifier si cette observation a des données pour le mois sélectionné
            const hasMonthData = commune.phenologie.some(pheno => 
              pheno['CD REF (pheno!mois!insee)'] === cdRef && 
              pheno['Mois Obs'] === filters.selectedMois
            )
            if (!hasMonthData) return
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
          
          if (species.listeRouge) {
            const statut = species.listeRouge['Label Statut'] || 'Non évalué'
            const current = statusStats.get(statut) || 0
            statusStats.set(statut, current + 1)
          } else {
            const current = statusStats.get('Non évalué') || 0
            statusStats.set('Non évalué', current + 1)
          }
        }
      })

      // Convertir en format pour Nivo Bar
      const barData: BarData[] = Array.from(statusStats.entries()).map(([statut, count]) => ({
        category: statut,
        value: count
      }))

      // Trier par valeur décroissante
      barData.sort((a, b) => (b.value as number) - (a.value as number))

      setData(barData)
      console.log('🚨 Données listes rouges pour', codeInsee, 'règne:', selectedRegne, 'filtres appliqués:', filters, ':', barData)
    }
  }, [communeData, speciesData, codeInsee, filters])

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🚨</div>
          <p>Aucune donnée de liste rouge disponible</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveBar
      data={data}
      keys={['value']}
      indexBy="category"
      margin={{ top: 20, right: 20, bottom: 120, left: 60 }}
      padding={0.3}
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      colors={['#8B4513', '#D2B48C', '#F4A460', '#CD853F', '#DEB887', '#BC8F8F', '#A0522D', '#DAA520', '#B8860B', '#8FBC8F']}
      borderColor={{
        from: 'color',
        modifiers: [
          ['darker', 1.6]
        ]
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        legend: 'Statut liste rouge',
        legendPosition: 'middle',
        legendOffset: 100
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Nombre d\'espèces',
        legendPosition: 'middle',
        legendOffset: -40
      }}
      enableLabel={true}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{
        from: 'color',
        modifiers: [
          ['darker', 1.6]
        ]
      }}
      animate={true}
      motionConfig="gentle"
      onClick={(node) => {
        handleChartClick({
          chartType: 'bar',
          dataKey: 'status',
          value: node.indexValue as string,
          action: 'click'
        })
      }}
      onMouseEnter={(node) => {
        handleChartHover({
          chartType: 'bar',
          dataKey: 'status',
          value: node.indexValue as string,
          action: 'hover'
        })
      }}
      onMouseLeave={() => {
        handleChartHover(null)
      }}
      tooltip={({ id, value, indexValue, color }) => {
        const isCurrentFiltered = isFiltered('bar', 'status', indexValue as string)
        
        return (
          <div className="glass rounded-lg p-3 text-sm">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              <span className="font-medium">{indexValue}</span>
              {isCurrentFiltered && (
                <span className="text-green-600 text-xs">• Filtré</span>
              )}
            </div>
            <div className="text-gray-600 mt-1">
              {value} espèce{(value as number) > 1 ? 's' : ''}
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