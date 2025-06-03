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
          
          if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) {
            return
          }
          
          if (filters.selectedGroup2 && species.group2 !== filters.selectedGroup2) {
            return
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

      // Convertir en format pour Nivo CirclePacking
      const children: BubbleData[] = Array.from(groupStats.entries()).map(([groupe, count]) => ({
        id: groupe,
        value: count
      }))

      // Trier par valeur décroissante
      children.sort((a, b) => b.value - a.value)

      const bubbleData: BubbleData = {
        id: taxonomicLevel.title,
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
    <ResponsiveCirclePacking
      data={data}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      id="id"
      value="value"
      colors={[
        '#2D5016', // Vert forêt foncé
        '#4A7C59', // Vert sauge 
        '#6B8E23', // Olive vert
        '#8FBC8F', // Gris vert clair
        '#90EE90', // Vert clair 
        '#32CD32', // Vert lime
        '#228B22', // Vert forêt
        '#006400', // Vert foncé
        '#2E8B57', // Vert de mer
        '#3CB371', // Vert medium
        '#20B2AA', // Turquoise foncé
        '#66CDAA', // Aquamarine medium
        '#9ACD32', // Jaune vert
        '#8B4513', // Brun selle
        '#CD853F', // Pérou
        '#DAA520', // Baguette d'or
        '#B8860B'  // Or foncé
      ]}
      padding={6}
      enableLabels={true}
      labelsSkipRadius={15}
      labelsFilter={(label) => label.node.id !== 'root' && !label.node.id.includes('taxonomiques') && !label.node.id.includes('Sous-groupes') && !label.node.id.includes('Ordres') && !label.node.id.includes('Familles')}
      labelTextColor={{
        from: 'color',
        modifiers: [
          ['darker', 2.5]
        ]
      }}
      borderWidth={3}
      borderColor={{
        from: 'color',
        modifiers: [
          ['darker', 0.4]
        ]
      }}
      animate={true}
      motionConfig="gentle"
      tooltip={({ id, value }) => {
        // Filtrer la valeur "root" qui correspond au nœud racine de la hiérarchie
        if (id === 'root' || id === taxonomicLevel.title) return <div></div>
        
        return (
          <div className="bg-transparent backdrop-blur-sm rounded-lg p-4 text-sm shadow-xl border border-green-800/30">
            <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
              <span>{id}</span>
              {isFiltered('bubble', taxonomicLevel.field === 'groupe' ? 'group' : taxonomicLevel.field, id) && (
                <span className="bg-green-700/20 text-green-700 px-2 py-1 rounded-full text-xs">Filtré</span>
              )}
            </div>
            <div className="text-green-700 mb-2">
              <span className="font-medium text-green-800">{value}</span> espèces
            </div>
            <div className="text-xs text-green-600 border-t border-green-800/20 pt-2">
              Cliquez pour filtrer par {taxonomicLevel.level === 'group1' ? 'groupe' : taxonomicLevel.level === 'group2' ? 'sous-groupe' : taxonomicLevel.level}
            </div>
          </div>
        )
      }}
      onClick={(node) => {
        // Filtrer la valeur "root" pour éviter qu'elle devienne un filtre
        if (node.id === 'root' || node.id === taxonomicLevel.title) return
        handleChartClick({
          chartType: 'bubble',
          dataKey: taxonomicLevel.field === 'groupe' ? 'group' : taxonomicLevel.field,
          value: node.id as string,
          action: 'click'
        })
      }}
      onMouseEnter={(node) => {
        // Filtrer la valeur "root" 
        if (node.id === 'root' || node.id === taxonomicLevel.title) return
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
  )
} 