'use client'

import { useEffect, useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useAppStore } from '../../store/useAppStore'
import { useChartInteractions } from '../../hooks/useChartInteractions'
import { generateGreenColorRamp, GREEN_PALETTE } from '../../utils/colors'
import NoDataAnimation from '@/components/NoDataAnimation'
import { isValueInFilter } from '../../utils/filterHelpers'

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
          // Filtrer par mois sélectionnés (logique OU)
          if (!isValueInFilter(selectedMonthNumbers, pheno['Mois Obs'])) return
          
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
            
            // Ne pas appliquer le filtre selectedRedListCategory ici car on veut voir tous les statuts
            // Le filtre sera appliqué visuellement par la mise en évidence
            
            if (filters.selectedStatutReglementaire) {
              const statutsReglementaires = species.statuts.length > 0 
                ? species.statuts.map(s => s['LABEL STATUT (statuts)'])
                : ['Non réglementé']
              
              const hasMatchingStatus = statutsReglementaires.some(statut => 
                isValueInFilter(filters.selectedStatutReglementaire, statut)
              )
              
              if (!hasMatchingStatus) return
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
        
        // Appliquer les filtres d'années en premier
        if (filters.anneeDebut && obs['An Obs'] < filters.anneeDebut) return
        if (filters.anneeFin && obs['An Obs'] > filters.anneeFin) return
        
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
            
            // Ne pas appliquer le filtre selectedRedListCategory ici car on veut voir tous les statuts
            // Le filtre sera appliqué visuellement par la mise en évidence
          
          if (filters.selectedStatutReglementaire) {
            const statutsReglementaires = species.statuts.length > 0 
              ? species.statuts.map(s => s['LABEL STATUT (statuts)'])
              : ['Non réglementé']
            
            const hasMatchingStatus = statutsReglementaires.some(statut => 
              isValueInFilter(filters.selectedStatutReglementaire, statut)
            )
            
            if (!hasMatchingStatus) return
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
        id: statut,
        category: statut,
        value: count
      }))

      // Trier par valeur décroissante
      barData.sort((a, b) => (b.value as number) - (a.value as number))

      setData(barData)
      console.log('🚨 Données listes rouges pour', codeInsee, 'règne:', selectedRegne, 'filtres appliqués:', filters, ':', barData)
    }
  }, [communeData, speciesData, codeInsee, filters])

  if (data.length === 0) {
    return <NoDataAnimation message="Aucune donnée de liste rouge disponible" />
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
      colors={(bar) => {
        // Si un filtre de liste rouge est actif, mettre en évidence la barre correspondante
        if (filters.selectedRedListCategory) {
          if (isValueInFilter(filters.selectedRedListCategory, bar.indexValue as string)) {
            return GREEN_PALETTE.primary // Couleur principale pour la barre filtrée
          } else {
            return GREEN_PALETTE.light + '40' // Couleur atténuée pour les autres barres
          }
        }
        // Sinon, utiliser la palette normale
        const colors = generateGreenColorRamp(data.length)
        return colors[bar.index % colors.length]
      }}
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
        legend: null,
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
      tooltip={({ indexValue, value, color }) => (
        <div className="bg-white/90 backdrop-blur-md rounded-lg p-4 text-sm shadow-xl border border-green-800/30">
          <div className="font-semibold text-green-800 flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span>{indexValue}</span>
            {isFiltered('bar', 'status', indexValue) && (
              <span className="bg-green-700/20 text-green-700 px-2 py-1 rounded-full text-xs">Filtré</span>
            )}
          </div>
          <div className="text-green-700 mb-2">
            <span className="font-medium text-green-800">{value}</span> espèces
          </div>
          <div className="text-xs text-green-600 border-t border-green-800/20 pt-2">
            Cliquez pour filtrer par statut de liste rouge
          </div>
        </div>
      )}
      onClick={(data) => {
        handleChartClick({
          chartType: 'bar',
          dataKey: 'status',
          value: data.indexValue as string,
          action: 'click'
        })
      }}
      onMouseEnter={(data) => {
        handleChartHover({
          chartType: 'bar',
          dataKey: 'status',
          value: data.indexValue as string,
          action: 'hover'
        })
      }}
      onMouseLeave={() => {
        handleChartHover(null)
      }}
    />
  )
} 