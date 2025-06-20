'use client'

import { useEffect, useState } from 'react'
import { ResponsiveCirclePacking } from '@nivo/circle-packing'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'
import { isValueInFilter } from '../../utils/filterHelpers'
import { generateGreenColorRamp, GREEN_PALETTE } from '../../utils/colors'
import NoDataAnimation from '@/components/NoDataAnimation'

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
      
      if (filters.selectedMois) {
        // Si un filtre par mois est actif, utiliser les données phénologiques
        // Convertir les noms de mois en numéros pour la comparaison
        const monthNames = [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ]
        
        const selectedMonthNumbers = Array.isArray(filters.selectedMois) 
          ? filters.selectedMois.map((monthName: any) => {
              if (typeof monthName === 'string') {
                const index = monthNames.indexOf(monthName)
                return index !== -1 ? index + 1 : parseInt(monthName) || 0
              }
              return monthName || 0
            })
          : (() => {
              const monthValue = filters.selectedMois as any
              if (typeof monthValue === 'string') {
                const index = monthNames.indexOf(monthValue)
                return [index !== -1 ? index + 1 : parseInt(monthValue) || 0]
              }
              return [monthValue || 0]
            })()

        commune.phenologie.forEach(pheno => {
          if (!isValueInFilter(selectedMonthNumbers, pheno['Mois Obs'])) return
          
          const cdRef = pheno['CD REF (pheno!mois!insee)']
          const species = speciesData?.get(cdRef)
          
          if (species) {
            // Filtrer par règne si nécessaire
            if (selectedRegne && species.regne !== selectedRegne) return
            
            // Appliquer les filtres du store global
            if (filters.selectedRedListCategory) {
              const speciesStatus = species.listeRouge?.['Label Statut'] || 'Non évalué'
              if (!isValueInFilter(filters.selectedRedListCategory, speciesStatus)) return
            }
            
            if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) return
            if (filters.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
            if (filters.selectedOrdre && species.ordre !== filters.selectedOrdre) return
            if (filters.selectedFamille && species.famille !== filters.selectedFamille) return
            
            if (filters.selectedStatutReglementaire) {
              const speciesStatuts = species.statuts.map((s: any) => s['LABEL STATUT (statuts)'])
              const hasReglementaryStatus = speciesStatuts.length > 0
              
              if (Array.isArray(filters.selectedStatutReglementaire)) {
                const matchesAnyStatus = filters.selectedStatutReglementaire.some((status: string) => {
                  if (status === 'Non réglementé') {
                    return !hasReglementaryStatus
                  }
                  return speciesStatuts.includes(status)
                })
                if (!matchesAnyStatus) return
              } else {
                if (filters.selectedStatutReglementaire === 'Non réglementé') {
                  if (hasReglementaryStatus) return
                } else {
                  if (!speciesStatuts.includes(filters.selectedStatutReglementaire)) return
                }
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
            const speciesStatus = species.listeRouge?.['Label Statut'] || 'Non évalué'
            if (!isValueInFilter(filters.selectedRedListCategory, speciesStatus)) return
          }
          
            if (filters.selectedGroupe && species.groupe !== filters.selectedGroupe) return
            if (filters.selectedGroup2 && species.group2 !== filters.selectedGroup2) return
            if (filters.selectedOrdre && species.ordre !== filters.selectedOrdre) return
            if (filters.selectedFamille && species.famille !== filters.selectedFamille) return
          
          if (filters.selectedStatutReglementaire) {
            const speciesStatuts = species.statuts.map((s: any) => s['LABEL STATUT (statuts)'])
            const hasReglementaryStatus = speciesStatuts.length > 0
            
            if (Array.isArray(filters.selectedStatutReglementaire)) {
              const matchesAnyStatus = filters.selectedStatutReglementaire.some((status: string) => {
                if (status === 'Non réglementé') {
                  return !hasReglementaryStatus
                }
                return speciesStatuts.includes(status)
              })
              if (!matchesAnyStatus) return
            } else {
              if (filters.selectedStatutReglementaire === 'Non réglementé') {
                if (hasReglementaryStatus) return
              } else {
                if (!speciesStatuts.includes(filters.selectedStatutReglementaire)) return
              }
            }
          }
          
          // Appliquer les filtres d'années
          if (filters.anneeDebut && obs['An Obs'] < filters.anneeDebut) return
          if (filters.anneeFin && obs['An Obs'] > filters.anneeFin) return
          
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
    return <NoDataAnimation message="Aucune donnée disponible" />
  }

  return (
    <div className="h-full">
      <ResponsiveCirclePacking
        data={data}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        id="id"
        value="value"
        colors={(node) => {
          // Utiliser la nouvelle palette de couleurs verts
          if (node.depth === 0) {
            return GREEN_PALETTE.secondary  // Vert mousse pour le root
          } else {
            const colors = generateGreenColorRamp(data?.children?.length || 0)
            const nodeIndex = data?.children?.findIndex(child => child.id === node.id) || 0
            return colors[nodeIndex] || colors[0]
          }
        }}
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