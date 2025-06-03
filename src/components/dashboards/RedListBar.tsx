'use client'

import { useEffect, useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useAppStore } from '../../store/useAppStore'

interface RedListBarProps {
  codeInsee: string
  selectedRegne: string
}

interface BarData {
  statut: string
  count: number
  color?: string
}

export default function RedListBar({ codeInsee, selectedRegne }: RedListBarProps) {
  const { communeData, speciesData } = useAppStore()
  const [data, setData] = useState<BarData[]>([])

  useEffect(() => {
    if (communeData && speciesData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      // Compter les espèces par statut liste rouge
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
          if (selectedRegne !== 'Tous') {
            // Utiliser le vrai règne de l'espèce
            if (species.regne !== selectedRegne) {
              return // Ignorer cette espèce
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

      // Convertir en format pour Nivo
      const barData: BarData[] = Array.from(statusStats.entries()).map(([statut, count]) => ({
        statut: statut || 'Non évalué',
        count
      }))

      // Trier par valeur décroissante
      barData.sort((a, b) => b.count - a.count)

      setData(barData)
      console.log('🚨 Données listes rouges pour', codeInsee, 'règne:', selectedRegne, ':', barData)
    }
  }, [communeData, speciesData, codeInsee, selectedRegne])

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
      keys={['count']}
      indexBy="statut"
      margin={{ top: 20, right: 20, bottom: 120, left: 60 }}
      padding={0.3}
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      colors={{ scheme: 'spectral' }}
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
      tooltip={({ id, value, indexValue, color }) => (
        <div className="glass rounded-lg p-3 text-sm">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            ></div>
            <span className="font-medium">{indexValue}</span>
          </div>
          <div className="text-gray-600 mt-1">
            {value} espèce{(value as number) > 1 ? 's' : ''}
          </div>
        </div>
      )}
    />
  )
} 