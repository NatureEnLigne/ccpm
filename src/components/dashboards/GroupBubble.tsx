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

  // Déterminer quel niveau taxonomique afficher selon les filtres actifs
  const getTaxonomicLevel = () => {
    // Si aucun filtre de groupe, afficher Group1 Inpn
    if (!filters.selectedGroupe) {
      return { level: 'group1', title: 'Groupes taxonomiques', field: 'groupe' }
    }
    
    // Si Group1 est filtré mais pas Group2, afficher Group2 Inpn  
    if (filters.selectedGroupe && !filters.selectedGroup2) {
      return { level: 'group2', title: 'Sous-groupes taxonomiques', field: 'group2' }
    }
    
    // Si Group1 et Group2 sont filtrés, afficher Group3 Inpn (ou Ordre/Famille)
    if (filters.selectedGroupe && filters.selectedGroup2 && !filters.selectedOrdre) {
      return { level: 'ordre', title: 'Ordres', field: 'ordre' }
    }
    
    // Si Ordre est filtré, afficher Famille
    if (filters.selectedOrdre && !filters.selectedFamille) {
      return { level: 'famille', title: 'Familles', field: 'famille' }
    }
    
    // Dernier niveau : revenir aux espèces individuelles ou Group1 par défaut
    return { level: 'group1', title: 'Groupes taxonomiques', field: 'groupe' }
  }

  useEffect(() => {
    if (communeData && speciesData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      const taxonomicLevel = getTaxonomicLevel()
      
      // Compter les observations par niveau taxonomique déterminé
      const groupStats = new Map<string, number>()
      const selectedRegne = filters.selectedRegne
      
      if (filters.selectedMois) {
        // Si un filtre par mois est actif, utiliser les données phénologiques
        commune.phenologie.forEach(pheno => {
          if (pheno['Mois Obs'] !== filters.selectedMois) return
          
          const cdRef = pheno['CD REF (pheno!mois!insee)']
          const species = speciesData?.get(cdRef)
          
          if (species) {
            // Filtrer par règne si nécessaire
            if (selectedRegne && species.regne !== selectedRegne) return
            
            // Appliquer les filtres du store global
            if (filters.selectedRedListCategory) {
              if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
            }
            
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
            
            // Récupérer la valeur du champ taxonomique approprié
            let groupValue: string
            switch (taxonomicLevel.field) {
              case 'groupe':
                groupValue = species.groupe || 'Inconnu'
                break
              case 'group2':
                groupValue = species.group2 || 'Inconnu'
                break
              case 'ordre':
                groupValue = species.ordre || 'Inconnu'
                break
              case 'famille':
                groupValue = species.famille || 'Inconnu'
                break
              default:
                groupValue = species.groupe || 'Inconnu'
            }
            
            const current = groupStats.get(groupValue) || 0
            groupStats.set(groupValue, current + pheno['Nb Donnees'])
          }
        })
      } else {
        // Logique normale sans filtre par mois
      commune.observations.forEach(obs => {
        const cdRef = obs['Cd Ref']
        const species = speciesData.get(cdRef)
        
        if (species) {
          // Filtrer par règne si nécessaire
            if (selectedRegne && species.regne !== selectedRegne) return
          
          // Appliquer les filtres du store global
          if (filters.selectedRedListCategory) {
              if (species.listeRouge?.['Label Statut'] !== filters.selectedRedListCategory) return
          }
          
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
          
          // Récupérer la valeur du champ taxonomique approprié
          let groupValue: string
          switch (taxonomicLevel.field) {
            case 'groupe':
              groupValue = species.groupe || 'Inconnu'
              break
            case 'group2':
              groupValue = species.group2 || 'Inconnu'
              break
            case 'ordre':
              groupValue = species.ordre || 'Inconnu'
              break
            case 'famille':
              groupValue = species.famille || 'Inconnu'
              break
            default:
              groupValue = species.groupe || 'Inconnu'
          }
          
          const current = groupStats.get(groupValue) || 0
          groupStats.set(groupValue, current + obs['Nb Obs'])
        }
      })
      }

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
      console.log('🦋 Données bubble pour', codeInsee, 'niveau:', taxonomicLevel.level, 'filtres appliqués:', filters, ':', bubbleData)
    }
  }, [communeData, speciesData, codeInsee, filters])

  const taxonomicLevel = getTaxonomicLevel()

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
    <div className="h-full">
      <ResponsiveCirclePacking
        data={data}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        id="id"
        value="value"
        colors={(node) => {
          // Bulle parente avec dégradé, bulles enfants avec rampe de couleurs
          if (node.depth === 0) {
            return 'url(#gradient-green-brown)'
          } else {
            const colors = generateColorRamp(data?.children?.length || 0)
            const nodeIndex = data?.children?.findIndex(child => child.id === node.id) || 0
            return colors[nodeIndex] || colors[0]
          }
        }}
        defs={[
          {
            id: 'gradient-green-brown',
            type: 'linearGradient',
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 1,
            colors: [
              { offset: 0, color: '#2d5016' },    // Vert foncé
              { offset: 100, color: '#cd853f' }   // Marron doré
            ]
          }
        ]}
        padding={1}
        enableLabels={true}
        labelsSkipRadius={8}
        labelsFilter={(label) => label.node.id !== 'root'}
        labelTextColor="#ffffff"
        borderWidth={2}
        borderColor={{
          from: 'color',
          modifiers: [
            ['darker', 0.6]
          ]
        }}
        animate={true}
        motionConfig="gentle"
        tooltip={({ id, value }) => {
          // Filtrer la valeur "root" qui correspond au nœud racine de la hiérarchie
          if (id === 'root') return <div></div>
          
          return (
            <div className="bg-white/90 backdrop-blur-md rounded-lg p-4 text-sm shadow-xl border border-green-800/30">
              <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                <span>{id}</span>
                {isFiltered('bubble', taxonomicLevel.field === 'groupe' ? 'group' : taxonomicLevel.field, id) && (
                  <span className="bg-green-700/20 text-green-700 px-2 py-1 rounded-full text-xs">Filtré</span>
                )}
              </div>
              <div className="text-green-700 mb-2">
                <span className="font-medium text-green-800">{value}</span> observations
              </div>
              <div className="text-xs text-green-600 border-t border-green-800/20 pt-2">
                Cliquez pour filtrer par {taxonomicLevel.level === 'group1' ? 'groupe' : taxonomicLevel.level === 'group2' ? 'sous-groupe' : taxonomicLevel.level}
              </div>
            </div>
          )
        }}
        onClick={(node) => {
          // Filtrer la valeur "root" pour éviter qu'elle devienne un filtre
          if (node.id === 'root') return
          handleChartClick({
            chartType: 'bubble',
            dataKey: taxonomicLevel.field === 'groupe' ? 'group' : taxonomicLevel.field,
            value: node.id as string,
            action: 'click'
          })
        }}
        onMouseEnter={(node) => {
          // Filtrer la valeur "root" 
          if (node.id === 'root') return
          handleChartHover({
            chartType: 'bubble',
            dataKey: taxonomicLevel.field === 'groupe' ? 'group' : taxonomicLevel.field,
            value: node.id as string,
            action: 'hover'
          })
        }}
        onMouseLeave={() => {
          handleChartHover(null)
        }}
      />
    </div>
  )
} 