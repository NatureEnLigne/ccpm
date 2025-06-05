'use client'

import { useEffect, useState } from 'react'
import { ResponsiveTreeMap } from '@nivo/treemap'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'

interface StatusTreemapProps {
  codeInsee: string
}

interface TreemapData {
  id: string
  value: number
  children?: TreemapData[]
}

export default function StatusTreemap({ codeInsee }: StatusTreemapProps) {
  const { communeData, speciesData, filters } = useAppStore()
  const { handleChartClick, handleChartHover, isFiltered } = useChartInteractions()
  const [data, setData] = useState<TreemapData | null>(null)

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
            if (filters.selectedRedListCategory) {
              if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
            }
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
            if (species.statuts.length > 0) {
              // Créer un Set pour éviter de compter plusieurs fois le même statut pour une espèce
              const speciesStatuts = new Set<string>()
              species.statuts.forEach(statut => {
                const statutLabel = statut['LABEL STATUT (statuts)'] || 'Inconnu'
                speciesStatuts.add(statutLabel)
              })
              
              // Compter cette espèce pour chaque statut unique qu'elle possède
              speciesStatuts.forEach(statutLabel => {
                const current = statusStats.get(statutLabel) || 0
                statusStats.set(statutLabel, current + 1)
              })
            } else {
              const current = statusStats.get('Non réglementé') || 0
              statusStats.set('Non réglementé', current + 1)
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
          if (filters.selectedRedListCategory) {
              if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
            }
            if (filters.selectedOrdre && species.ordre !== filters.selectedOrdre) return
            if (filters.selectedFamille && species.famille !== filters.selectedFamille) return
          
          if (filters.selectedStatutReglementaire) {
            const hasStatus = species.statuts.some(statut => 
              statut['LABEL STATUT (statuts)'] === filters.selectedStatutReglementaire
            )
              if (!hasStatus && filters.selectedStatutReglementaire !== 'Non réglementé') return
              if (filters.selectedStatutReglementaire === 'Non réglementé' && species.statuts.length > 0) return
          }
          
          if (species.statuts.length > 0) {
              // Créer un Set pour éviter de compter plusieurs fois le même statut pour une espèce
              const speciesStatuts = new Set<string>()
            species.statuts.forEach(statut => {
                const statutLabel = statut['LABEL STATUT (statuts)'] || 'Inconnu'
                speciesStatuts.add(statutLabel)
              })
              
              // Compter cette espèce pour chaque statut unique qu'elle possède
              speciesStatuts.forEach(statutLabel => {
                const current = statusStats.get(statutLabel) || 0
                statusStats.set(statutLabel, current + 1)
            })
          } else {
            const current = statusStats.get('Non réglementé') || 0
            statusStats.set('Non réglementé', current + 1)
          }
        }
      })
      }

      // Convertir en format pour Nivo Treemap
      const children: TreemapData[] = Array.from(statusStats.entries()).map(([statut, count]) => ({
        id: statut,
        value: count
      }))

      // Trier par valeur décroissante
      children.sort((a, b) => b.value - a.value)

      const treemapData: TreemapData = {
        id: 'Statuts Réglementaires',
        value: 0, // Non utilisé pour le root
        children
      }

      setData(treemapData)
      console.log('⚖️ Données statuts pour', codeInsee, 'règne:', selectedRegne, 'filtres appliqués:', filters, ':', treemapData)
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
      parentLabelSize={0}
      parentLabelTextColor="transparent"
      borderColor={{
        from: 'color',
        modifiers: [
          ['darker', 0.1]
        ]
      }}
      colors={generateColorRamp(data.children.length)}
      animate={true}
      motionConfig="gentle"
      tooltip={({ node }) => {
        // Filtrer la valeur "root" qui correspond au nœud racine
        if (node.id === 'root' || node.id === 'Statuts réglementaires') return <div></div>
        
        const isCurrentFiltered = isFiltered('treemap', 'status', node.id)
        
        return (
          <div className="bg-white/80 backdrop-blur-md rounded-lg p-4 text-sm shadow-xl border border-stone-800/30">
            <div className="font-semibold text-stone-800 flex items-center gap-2 mb-2">
              <span>{node.id}</span>
              {isCurrentFiltered && (
                <span className="bg-stone-700/20 text-stone-700 px-2 py-1 rounded-full text-xs">Filtré</span>
              )}
            </div>
            <div className="text-stone-700 mb-2">
              <span className="font-medium text-stone-800">{node.value}</span> espèces
            </div>
            <div className="text-xs text-stone-600 border-t border-stone-800/20 pt-2">
              Cliquez pour filtrer par statut
            </div>
          </div>
        )
      }}
      onClick={(node) => {
        // Filtrer la valeur "root" pour éviter qu'elle devienne un filtre
        if (node.id === 'root' || node.id === 'Statuts réglementaires') return
        handleChartClick({
          chartType: 'treemap',
          dataKey: 'status',
          value: node.id as string,
          action: 'click'
        })
      }}
      onMouseEnter={(node) => {
        // Filtrer la valeur "root"
        if (node.id === 'root' || node.id === 'Statuts réglementaires') return
        handleChartHover({
          chartType: 'treemap',
          dataKey: 'status',
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