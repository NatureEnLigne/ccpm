'use client'

import { useEffect, useState } from 'react'
import { ResponsiveStream } from '@nivo/stream'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'
import { isValueInFilter } from '../../utils/filterHelpers'
import { generateGreenColorRamp } from '../../utils/colors'
import NoDataAnimation from '@/components/NoDataAnimation'

interface GroupsEvolutionStreamProps {
  codeInsee: string
}

interface StreamData {
  [key: string]: number | string
}

export default function GroupsEvolutionStream({ codeInsee }: GroupsEvolutionStreamProps) {
  const { communeData, speciesData, filters } = useAppStore()
  const { handleChartClick, handleChartHover, isFiltered } = useChartInteractions()
  const [data, setData] = useState<StreamData[]>([])
  const [keys, setKeys] = useState<string[]>([])

  useEffect(() => {
    if (communeData && speciesData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      // Déterminer quel niveau taxonomique afficher selon les filtres actifs
      const getTaxonomicLevel = () => {
        // Si aucun filtre de groupe, afficher Group1 Inpn
        if (!filters.selectedGroupe) {
          return { level: 'group1', field: 'groupe' }
        }
        
        // Si Group1 est filtré mais pas Group2, afficher Group2 Inpn  
        if (filters.selectedGroupe && !filters.selectedGroup2) {
          return { level: 'group2', field: 'group2' }
        }
        
        // Si Group1 et Group2 sont filtrés, afficher Ordre
        if (filters.selectedGroupe && filters.selectedGroup2 && !filters.selectedOrdre) {
          return { level: 'ordre', field: 'ordre' }
        }
        
        // Si Ordre est filtré, afficher Famille
        if (filters.selectedOrdre && !filters.selectedFamille) {
          return { level: 'famille', field: 'famille' }
        }
        
        // Dernier niveau : revenir aux groupes par défaut
        return { level: 'group1', field: 'groupe' }
      }

      const taxonomicLevel = getTaxonomicLevel()
      
      // Compter les observations par année et par groupe taxonomique
      const yearGroupData = new Map<number, Map<string, number>>()
      const allGroups = new Set<string>()
      const selectedRegne = filters.selectedRegne
      
      commune.observations.forEach(obs => {
        const cdRef = obs['Cd Ref']
        const species = speciesData.get(cdRef)
        const year = obs['An Obs']
        
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
          if (filters.anneeDebut && year < filters.anneeDebut) return
          if (filters.anneeFin && year > filters.anneeFin) return
          
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
          
          // Ajouter le groupe à la liste de tous les groupes
          allGroups.add(groupValue)
          
          // Initialiser l'année si elle n'existe pas
          if (!yearGroupData.has(year)) {
            yearGroupData.set(year, new Map<string, number>())
          }
          
          const yearData = yearGroupData.get(year)!
          const current = yearData.get(groupValue) || 0
          yearData.set(groupValue, current + obs['Nb Obs'])
        }
      })

      // Convertir en format pour Nivo Stream
      const years = Array.from(yearGroupData.keys()).sort((a, b) => a - b)
      const groupsArray = Array.from(allGroups).sort()
      
      const streamData: StreamData[] = years.map(year => {
        const yearEntry: StreamData = { year: year.toString() }
        
        groupsArray.forEach(group => {
          const yearData = yearGroupData.get(year)
          yearEntry[group] = yearData?.get(group) || 0
        })
        
        return yearEntry
      })

      setData(streamData)
      setKeys(groupsArray)
      
      console.log('🌊 Données stream évolution groupes pour', codeInsee, 'niveau:', taxonomicLevel.level, ':', {
        years: years.length,
        groups: groupsArray.length,
        data: streamData.slice(0, 3) // Afficher seulement les 3 premières années pour debug
      })
    }
  }, [communeData, speciesData, codeInsee, filters])

  if (data.length === 0 || keys.length === 0) {
    return <NoDataAnimation message="Aucune donnée d'évolution disponible" />
  }

  // Générer les couleurs pour les groupes
  const colors = generateGreenColorRamp(keys.length)

  return (
    <div className="h-full">
      <ResponsiveStream
        data={data}
        keys={keys}
        margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: 'Années',
          legendOffset: 50,
          legendPosition: 'middle'
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Nombre d\'observations',
          legendOffset: -45,
          legendPosition: 'middle'
        }}
        offsetType="diverging"
        colors={colors}
        fillOpacity={0.85}
        borderColor={{ theme: 'background' }}
        borderWidth={1}
        animate={true}
        motionConfig="gentle"
        enableGridX={true}
        enableGridY={true}
        tooltip={({ layer }) => (
          <div className="bg-white/90 backdrop-blur-md rounded-lg p-4 text-sm shadow-xl border border-green-800/30">
            <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full border border-green-800/30" 
                style={{ backgroundColor: layer.color }}
              />
              <span>{layer.id}</span>
            </div>
            <div className="text-green-700">
              Évolution des contributions par groupe
            </div>
          </div>
        )}
      />
    </div>
  )
} 