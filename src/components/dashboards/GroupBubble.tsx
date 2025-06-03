'use client'

import { useEffect, useState } from 'react'
import { ResponsiveCirclePacking } from '@nivo/circle-packing'
import { useAppStore } from '../../store/useAppStore'

interface GroupBubbleProps {
  codeInsee: string
  selectedRegne: string
}

interface BubbleData {
  id: string
  value: number
  children?: BubbleData[]
}

export default function GroupBubble({ codeInsee, selectedRegne }: GroupBubbleProps) {
  const { communeData, speciesData } = useAppStore()
  const [data, setData] = useState<BubbleData | null>(null)

  useEffect(() => {
    if (communeData && speciesData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      // Compter les observations par groupe taxonomique
      const groupStats = new Map<string, number>()
      
      commune.observations.forEach(obs => {
        const cdRef = obs['Cd Ref']
        const species = speciesData.get(cdRef)
        
        if (species) {
          // Filtrer par règne si nécessaire
          if (selectedRegne !== 'Tous') {
            // Utiliser le vrai règne de l'espèce
            if (species.regne !== selectedRegne) {
              return // Ignorer cette espèce
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
        id: 'root',
        value: 0, // Non utilisé pour le root
        children
      }

      setData(bubbleData)
      console.log('🦋 Données bubble pour', codeInsee, 'règne:', selectedRegne, ':', bubbleData)
    }
  }, [communeData, speciesData, codeInsee, selectedRegne])

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
      colors={{ scheme: 'category10' }}
      padding={4}
      enableLabels={true}
      labelsSkipRadius={10}
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
      tooltip={({ id, value, color }) => (
        <div className="glass rounded-lg p-3 text-sm">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            ></div>
            <span className="font-medium">{id}</span>
          </div>
          <div className="text-gray-600 mt-1">
            {value.toLocaleString()} observations
          </div>
        </div>
      )}
    />
  )
} 