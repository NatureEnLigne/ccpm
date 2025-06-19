'use client'

import { useState, useEffect } from 'react'
import { AreaBump } from '@nivo/bump'
import { useAppStore } from '../../store/useAppStore'
import { loadSyntheseInsee } from '../../utils/csvLoader'
import NoDataAnimation from '../NoDataAnimation'

interface AreaBumpChartProps {
  codeInsee: string
}

interface BumpDataPoint {
  id: string
  data: Array<{
    x: string
    y: number
  }>
}

interface SpeciesRow {
  code_insee: string
  date_obs: string
  nom_vern?: string
  nom_complet?: string
  groupe?: string
  [key: string]: any
}

export default function AreaBumpChart({ codeInsee }: AreaBumpChartProps) {
  const { filters } = useAppStore()
  const [chartData, setChartData] = useState<{ data: any[], isEmpty: boolean }>({ 
    data: [], 
    isEmpty: true 
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const speciesData = await loadSyntheseInsee() as SpeciesRow[]
        
        if (!speciesData || speciesData.length === 0) {
          setChartData({ data: [], isEmpty: true })
          return
        }

        // Filtrer les données pour la commune
        const communeData = speciesData.filter((row: SpeciesRow) => row.code_insee === codeInsee)
        
        if (communeData.length === 0) {
          setChartData({ data: [], isEmpty: true })
          return
        }

        // Appliquer les filtres de base
        let filteredData = communeData

        // Filtre par groupe taxonomique
        if (filters.selectedGroupe && filters.selectedGroupe !== 'tous') {
          filteredData = filteredData.filter((row: SpeciesRow) => row.groupe === filters.selectedGroupe)
        }

        // Filtre par mois
        if (filters.selectedMois) {
          const selectedMonths = Array.isArray(filters.selectedMois) ? filters.selectedMois : [filters.selectedMois]
          filteredData = filteredData.filter((row: SpeciesRow) => {
            if (!row.date_obs) return false
            const obsDate = new Date(row.date_obs)
            const month = obsDate.getMonth() + 1
            return selectedMonths.includes(month)
          })
        }

        if (filteredData.length === 0) {
          setChartData({ data: [], isEmpty: true })
          return
        }

        // Obtenir la date actuelle et calculer la date d'il y a un an
        const currentDate = new Date()
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(currentDate.getFullYear() - 1)

        // Filtrer les données de la dernière année
        const lastYearData = filteredData.filter((row: SpeciesRow) => {
          if (!row.date_obs) return false
          const obsDate = new Date(row.date_obs)
          return obsDate >= oneYearAgo && obsDate <= currentDate
        })

        if (lastYearData.length === 0) {
          setChartData({ data: [], isEmpty: true })
          return
        }

        // Compter les observations par espèce
        const speciesCount: { [key: string]: number } = {}
        lastYearData.forEach((row: SpeciesRow) => {
          const speciesName = row.nom_vern || row.nom_complet || 'Espèce inconnue'
          speciesCount[speciesName] = (speciesCount[speciesName] || 0) + 1
        })

        // Obtenir les 5 espèces les plus vues
        const top5Species = Object.entries(speciesCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name]) => name)

        if (top5Species.length === 0) {
          setChartData({ data: [], isEmpty: true })
          return
        }

        // Créer des données mensuelles pour les 12 derniers mois
        const monthlyData: { [key: string]: { [key: string]: number } } = {}
        
        // Initialiser les 12 derniers mois
        for (let i = 11; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          const monthKey = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })
          monthlyData[monthKey] = {}
          top5Species.forEach(species => {
            monthlyData[monthKey][species] = 0
          })
        }

        // Remplir les données mensuelles
        lastYearData.forEach((row: SpeciesRow) => {
          const speciesName = row.nom_vern || row.nom_complet || 'Espèce inconnue'
          if (top5Species.includes(speciesName) && row.date_obs) {
            const obsDate = new Date(row.date_obs)
            const monthKey = obsDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })
            if (monthlyData[monthKey]) {
              monthlyData[monthKey][speciesName]++
            }
          }
        })

        // Convertir au format requis par @nivo/bump
        const bumpData: any[] = top5Species.map(species => ({
          id: species,
          data: Object.entries(monthlyData).map(([month, counts]) => ({
            x: month,
            y: counts[species] || 0
          }))
        }))

        setChartData({ data: bumpData, isEmpty: false })
      } catch (error) {
        console.error('Erreur lors du chargement des données AreaBump:', error)
        setChartData({ data: [], isEmpty: true })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [codeInsee, filters])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (chartData.isEmpty) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <NoDataAnimation message="Aucune donnée disponible pour les espèces de la dernière année" />
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <AreaBump
        data={chartData.data}
        width={600}
        height={400}
        margin={{ top: 20, right: 120, bottom: 60, left: 60 }}
        colors={{ scheme: 'category10' }}
      />
    </div>
  )
} 