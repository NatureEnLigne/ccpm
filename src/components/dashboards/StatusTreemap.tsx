'use client'

import { useEffect, useState } from 'react'
import { ResponsiveTreeMap } from '@nivo/treemap'
import { useAppStore } from '../../store/useAppStore'

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
          if (selectedRegne !== 'Tous') {
            // Utiliser le vrai règne de l'espèce
            if (species.regne !== selectedRegne) {
              return // Ignorer cette espèce
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
      console.log('⚖️ Données statuts pour', codeInsee, 'règne:', selectedRegne, ':', treemapData)
    }
  }, [communeData, speciesData, codeInsee, selectedRegne])

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
      colors={{ scheme: 'nivo' }}
      animate={true}
      motionConfig="gentle"
      tooltip={({ node }) => (
        <div className="glass rounded-lg p-3 text-sm">
          <div className="font-medium">{node.id}</div>
          <div className="text-gray-600 mt-1">
            {node.value} espèce{node.value > 1 ? 's' : ''}
          </div>
        </div>
      )}
    />
  )
} 