'use client'

import { useEffect, useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'
import { isValueInFilter } from '../../utils/filterHelpers'
import { generateGreenColorRamp } from '../../utils/colors'
import NoDataAnimation from '@/components/NoDataAnimation'

interface ObservationsAnnuellesBarProps {
  codeInsee: string
}

interface BarData {
  year: string
  [key: string]: number | string
}

export default function ObservationsAnnuellesBar({ codeInsee }: ObservationsAnnuellesBarProps) {
  const { communeData, speciesData, filters, setFilter } = useAppStore()
  const { isFiltered } = useChartInteractions()
  const [data, setData] = useState<BarData[]>([])
  const [groupKeys, setGroupKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!communeData || !speciesData) {
      setLoading(false)
      return
    }

    // Récupérer les données de la commune
    const commune = communeData.get(codeInsee)
    if (!commune) {
      setData([])
      setGroupKeys([])
      setLoading(false)
      return
    }

    // Récupérer toutes les espèces qui ont des observations dans cette commune
    let allSpeciesInCommune = Array.from(speciesData.values()).filter(species => 
      species.observations.some(obs => String(obs['Insee (Synthese!Insee)']) === codeInsee)
    )

    // Fonction pour déterminer le niveau taxonomique (même logique que GroupBubble)
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

    const taxonomicLevel = getTaxonomicLevel()
    const groupField = taxonomicLevel.field

    // Grouper les données par année et par groupe taxonomique avec filtrage
    const yearGroupMap = new Map<string, Map<string, number>>()
    const selectedRegne = filters.selectedRegne
    
    // Parcourir les observations de la commune directement
    commune.observations.forEach(obs => {
      const cdRef = obs['Cd Ref']
      const species = speciesData.get(cdRef)
      
      if (species) {
        // Appliquer les mêmes filtres que GroupBubble
        // Filtrer par règne si nécessaire
        if (selectedRegne && species.regne !== selectedRegne) return
        
        // Appliquer les filtres du store global
        if (filters.selectedRedListCategory) {
          const speciesStatus = species.listeRouge?.['Label Statut'] || 'Non évalué'
          if (Array.isArray(filters.selectedRedListCategory)) {
            if (!filters.selectedRedListCategory.includes(speciesStatus)) return
          } else if (speciesStatus !== filters.selectedRedListCategory) {
            return
          }
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
        
        const year = obs['An Obs']?.toString()
        
        if (year && groupValue) {
          if (!yearGroupMap.has(year)) {
            yearGroupMap.set(year, new Map())
          }
          
          const groupMap = yearGroupMap.get(year)!
          groupMap.set(groupValue, (groupMap.get(groupValue) || 0) + obs['Nb Obs'])
        }
      }
    })

    // Obtenir tous les groupes uniques
    const allGroups = new Set<string>()
    yearGroupMap.forEach(groupMap => {
      groupMap.forEach((_, group) => {
        allGroups.add(group)
      })
    })
    
    const sortedGroups = Array.from(allGroups).sort()
    setGroupKeys(sortedGroups)

    // Transformer en format pour Nivo Bar
    const chartData: BarData[] = []
    const sortedYears = Array.from(yearGroupMap.keys()).sort()
    
    sortedYears.forEach(year => {
      const yearData: BarData = { year }
      const groupMap = yearGroupMap.get(year)!
      
      sortedGroups.forEach(group => {
        yearData[group] = groupMap.get(group) || 0
      })
      
      chartData.push(yearData)
    })

    setData(chartData)
    setLoading(false)
  }, [communeData, speciesData, codeInsee, filters])

  // Gérer le clic sur une barre pour filtrer par année
  const handleBarClick = (data: any) => {
    const year = parseInt(data.data.year)
    if (year) {
      // Toggle le filtre d'année
      const currentYear = filters.selectedAnnee
      const newYear = currentYear === year ? null : year
      
      setFilter('selectedAnnee', newYear)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return <NoDataAnimation message="Aucune donnée d'observations annuelles disponible" />
  }

  // Générer les couleurs pour les groupes
  const colors = generateGreenColorRamp(groupKeys.length)

  return (
    <div className="h-full w-full">
      <ResponsiveBar
        data={data}
        keys={groupKeys}
        indexBy="year"
        margin={{ top: 20, right: 180, bottom: 40, left: 80 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={colors}
        defs={[
          {
            id: 'dots',
            type: 'patternDots',
            background: 'inherit',
            color: '#38bcb2',
            size: 4,
            padding: 1,
            stagger: true
          },
          {
            id: 'lines',
            type: 'patternLines',
            background: 'inherit',
            color: '#eed312',
            rotation: -45,
            lineWidth: 6,
            spacing: 10
          }
        ]}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 1.6]]
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: null,
          legendPosition: 'middle',
          legendOffset: 50
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Nombre d\'observations',
          legendPosition: 'middle',
          legendOffset: -60
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1.6]]
        }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 160,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 140,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 20,
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1
                }
              }
            ]
          }
        ]}
        onClick={handleBarClick}
        tooltip={({ id, value, color, data }) => (
          <div className="bg-white/90 backdrop-blur-md rounded-lg p-4 text-sm shadow-xl border border-green-800/30">
            <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full border border-green-800/30" 
                style={{ backgroundColor: color }}
              />
              <span>{id}</span>
              {isFiltered('bar', 'groupe', id as string) && (
                <span className="bg-green-700/20 text-green-700 px-2 py-1 rounded-full text-xs">Filtré</span>
              )}
            </div>
            <div className="text-green-700 mb-2">
              <span className="font-medium text-green-800">{value}</span> observations
            </div>
            <div className="text-green-700 mb-2">
              <span className="font-medium text-green-800">Année:</span> {data.year}
              {filters.selectedAnnee && filters.selectedAnnee.toString() === data.year && (
                <span className="bg-green-700/20 text-green-700 px-2 py-1 rounded-full text-xs ml-2">Filtrée</span>
              )}
            </div>
            <div className="text-xs text-green-600 border-t border-green-800/20 pt-2">
              Cliquez pour filtrer par année
            </div>
          </div>
        )}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  )
} 