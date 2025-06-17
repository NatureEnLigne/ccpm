'use client'

import { useEffect, useState } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'
import NoDataAnimation from '@/components/NoDataAnimation'
import { isValueInFilter } from '../../utils/filterHelpers'

interface PhenoLineProps {
  codeInsee: string
}

interface LineData {
  id: string
  data: { x: string; y: number }[]
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function PhenoLine({ codeInsee }: PhenoLineProps) {
  const { communeData, speciesData, filters } = useAppStore()
  const { handleChartClick, handleChartHover, isFiltered } = useChartInteractions()
  const [data, setData] = useState<LineData[]>([])

  useEffect(() => {
    if (communeData && speciesData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      // Compter les observations par mois
      const monthlyData = new Map<number, number>()
      const selectedRegne = filters.selectedRegne
      
      commune.phenologie.forEach(pheno => {
        const cdRef = pheno['CD REF (pheno!mois!insee)']
        const species = speciesData?.get(cdRef)
        
        // Filtrer par règne si spécifié
        if (selectedRegne && species && species.regne !== selectedRegne) {
          return
        }
        
        // Appliquer les filtres du store global
        if (species) {
          if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) {
            return
          }
          
          if (filters.selectedGroup2 && species.group2 !== filters.selectedGroup2) {
            return
          }
          
          if (filters.selectedRedListCategory) {
            const redListStatus = species.listeRouge?.['Label Statut'] || 'Non évalué'
            if (!isValueInFilter(filters.selectedRedListCategory, redListStatus)) return
          }
          
          if (filters.selectedOrdre && species.ordre !== filters.selectedOrdre) {
            return
          }
          
          if (filters.selectedFamille && species.famille !== filters.selectedFamille) {
            return
          }
          
          if (filters.selectedStatutReglementaire) {
            const statutsReglementaires = species.statuts.length > 0 
              ? species.statuts.map(s => s['LABEL STATUT (statuts)'])
              : ['Non réglementé']
            
            const hasMatchingStatus = statutsReglementaires.some(statut => 
              isValueInFilter(filters.selectedStatutReglementaire, statut)
            )
            
            if (!hasMatchingStatus) return
          }
        }
        
        // Filtrer par mois sélectionnés (logique OU)
        if (filters.selectedMois) {
          const moisObs = pheno['Mois Obs']
          if (!isValueInFilter(filters.selectedMois, moisObs)) {
            return
          }
        }
        
        const mois = pheno['Mois Obs']
        const current = monthlyData.get(mois) || 0
        monthlyData.set(mois, current + pheno['Nb Donnees'])
      })

      // Convertir en format pour Nivo
      const lineData: LineData[] = [{
        id: 'Observations',
        data: MONTH_NAMES.map((monthName, index) => {
          const monthNumber = index + 1
          const count = monthlyData.get(monthNumber) || 0
          return {
            x: monthName,
            y: count
          }
        })
      }]

      setData(lineData)
      console.log('📅 Données phénologie pour', codeInsee, 'règne:', selectedRegne, 'filtres appliqués:', filters, ':', lineData)
    }
  }, [communeData, speciesData, codeInsee, filters])

  if (data.length === 0 || data[0].data.every(d => d.y === 0)) {
    return <NoDataAnimation message="Aucune donnée de phénologie disponible" />
  }

  // Calculer les valeurs de graduations pour l'axe Y
  const getTickValues = () => {
    if (data.length === 0) return []
    
    const maxValue = Math.max(...data[0].data.map(d => d.y))
    if (maxValue === 0) return [0]
    
    // Créer des graduations intelligentes
    if (maxValue <= 5) {
      return Array.from({ length: maxValue + 1 }, (_, i) => i)
    } else if (maxValue <= 10) {
      return [0, Math.ceil(maxValue / 2), maxValue]
    } else {
      const step = Math.ceil(maxValue / 3)
      return [0, step, step * 2, maxValue].filter((v, i, arr) => arr.indexOf(v) === i)
    }
  }

  return (
    <ResponsiveLine
      data={data}
      margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
      xScale={{ type: 'point' }}
      yScale={{
        type: 'linear',
        min: 0,
        max: 'auto',
        stacked: false,
        reverse: false
      }}
      yFormat=" >-.0f"
      curve="catmullRom"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        legend: null,
        legendOffset: 50,
        legendPosition: 'middle'
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Nombre d\'observations',
        legendOffset: -60,
        legendPosition: 'middle',
        format: (value) => Math.floor(value).toString(),
        tickValues: getTickValues()
      }}
      enableArea={false}
      lineWidth={3}
      pointSize={6}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={3}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabelYOffset={-12}
      useMesh={true}
      colors={['#4a7c59']}  // Vert mousse uni
      animate={true}
      motionConfig="gentle"
      markers={filters.selectedMois ? (
        Array.isArray(filters.selectedMois) 
          ? filters.selectedMois.map(month => ({
              axis: 'x' as const,
              value: MONTH_NAMES[month - 1],
              lineStyle: {
                stroke: '#8B4513',
                strokeWidth: 3,
                strokeDasharray: '10 8'
              }
            }))
          : [{
              axis: 'x' as const,
              value: MONTH_NAMES[filters.selectedMois - 1],
              lineStyle: {
                stroke: '#8B4513',
                strokeWidth: 3,
                strokeDasharray: '10 8'
              }
            }]
      ) : []}
      onClick={(point) => {
        const monthIndex = MONTH_NAMES.indexOf(point.data.x as string) + 1
        handleChartClick({
          chartType: 'line',
          dataKey: 'month',
          value: monthIndex,
          action: 'click'
        })
      }}
      onMouseEnter={(point) => {
        const monthIndex = MONTH_NAMES.indexOf(point.data.x as string) + 1
        handleChartHover({
          chartType: 'line',
          dataKey: 'month',
          value: monthIndex,
          action: 'hover'
        })
      }}
      onMouseLeave={() => {
        handleChartHover(null)
      }}
      tooltip={({ point }) => {
        const monthIndex = MONTH_NAMES.indexOf(point.data.x as string) + 1
        const isCurrentFiltered = isFiltered('line', 'month', monthIndex)
        
        return (
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 text-sm shadow-xl border border-green-800/20">
            <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
              <span>{point.data.xFormatted}</span>
              {isCurrentFiltered && (
                <span className="bg-green-700/20 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Filtré</span>
              )}
            </div>
            <div className="text-green-700 mb-2">
              <span className="font-bold text-green-800 text-base">{point.data.yFormatted}</span> observations
            </div>
            <div className="text-xs text-green-600 border-t border-green-800/10 pt-2">
              💡 Cliquez pour filtrer par ce mois
            </div>
          </div>
        )
      }}
    />
  )
} 