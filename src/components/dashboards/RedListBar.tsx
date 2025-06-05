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

      const statusStats = new Map<string, number>()
      const selectedRegne = filters.selectedRegne
      
      if (filters.selectedMois) {
        // Si un filtre par mois est actif, utiliser les données phénologiques
        // Compter les espèces uniques pour ce mois
        const uniqueSpecies = new Set<string>()
        
        commune.phenologie.forEach(pheno => {
          if (pheno['Mois Obs'] !== filters.selectedMois) return
          
          const cdRef = pheno['CD REF (pheno!mois!insee)']
          const species = speciesData?.get(cdRef)
          
          if (species) {
            // Filtrer par règne si nécessaire
            if (selectedRegne && species.regne !== selectedRegne) return
            
            // Appliquer les filtres du store global
            if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) return
            if (filters.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
            if (filters.selectedOrdre && species.ordre !== filters.selectedOrdre) return
            if (filters.selectedFamille && species.famille !== filters.selectedFamille) return
            
            if (filters.selectedStatutReglementaire) {
              const hasStatus = species.statuts.some(statut => 
                statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
              )
              if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
              if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
            }
            
            // Ajouter cette espèce aux espèces uniques du mois
            uniqueSpecies.add(cdRef)
          }
        })
        
        // Compter les statuts pour les espèces uniques du mois
        uniqueSpecies.forEach(cdRef => {
          const species = speciesData.get(cdRef)
          if (species) {
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
      } else {
        // Logique normale sans filtre par mois
        const processedSpecies = new Set<string>()

      commune.observations.forEach(obs => {
        const cdRef = obs['Cd Ref']
        
        // Éviter de compter la même espèce plusieurs fois
        if (processedSpecies.has(cdRef)) return
        processedSpecies.add(cdRef)

          const species = speciesData?.get(cdRef)

        if (species) {
          // Filtrer par règne si nécessaire
            if (selectedRegne && species.regne !== selectedRegne) return
          
          // Appliquer les filtres du store global
            if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) return
            if (filters.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
            if (filters.selectedOrdre && species.ordre !== filters.selectedOrdre) return
            if (filters.selectedFamille && species.famille !== filters.selectedFamille) return
          
          if (filters.selectedStatutReglementaire) {
            const hasStatus = species.statuts.some(statut => 
              statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
            )
              if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
              if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
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
      }

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

  // Générer une rampe de couleurs cohérente du vert au marron
  const generateColorRamp = (count: number): string[] => {
    const colors: string[] = []
    const startColor = { r: 45, g: 80, b: 22 }    // #2d5016 (vert foncé)
    const endColor = { r: 205, g: 133, b: 63 }    // #cd853f (marron doré)
    
    for (let i = 0; i < count; i++) {
      const ratio = count === 1 ? 0 : i / (count - 1)
      const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio)
      const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio)
      const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio)
      colors.push(`rgb(${r}, ${g}, ${b})`)
    }
    
    return colors
  }

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
      colors={generateColorRamp(data.length)}
      defs={[
        {
          id: 'gradient-green-brown-bar',
          type: 'linearGradient',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          colors: [
            { offset: 0, color: '#2d5016' },
            { offset: 100, color: '#cd853f' }
          ]
        }
      ]}
      fill={[
        { match: '*', id: 'gradient-green-brown-bar' }
      ]}
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
      labelTextColor="#ffffff"
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
          <div className="bg-white/80 backdrop-blur-md rounded-lg p-4 text-sm shadow-xl border border-amber-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: color }}
              ></div>
              <span className="font-semibold text-amber-800">{indexValue}</span>
              {isCurrentFiltered && (
                <span className="bg-amber-700/20 text-amber-700 px-2 py-1 rounded-full text-xs">Filtré</span>
              )}
            </div>
            <div className="text-amber-700 mb-2">
              <span className="font-medium text-amber-800">{value}</span> espèce{(value as number) > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-amber-600 border-t border-amber-800/20 pt-2">
              Cliquez pour filtrer par statut
            </div>
          </div>
        )
      }}
    />
  )
} 