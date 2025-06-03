'use client'

import { useEffect, useState } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { useAppStore } from '../../store/useAppStore'

interface PhenoLineProps {
  codeInsee: string
  selectedRegne: string
}

interface LineData {
  id: string
  data: { x: string; y: number }[]
}

const MONTH_NAMES = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
]

export default function PhenoLine({ codeInsee, selectedRegne }: PhenoLineProps) {
  const { communeData } = useAppStore()
  const [data, setData] = useState<LineData[]>([])

  useEffect(() => {
    if (communeData && codeInsee) {
      const commune = communeData.get(codeInsee)
      if (!commune) return

      // Initialiser les données mensuelles
      const monthlyData = new Map<number, number>()
      for (let i = 1; i <= 12; i++) {
        monthlyData.set(i, 0)
      }

      // Compter les données par mois
      // Note: Pour l'instant, on n'a pas le règne dans les données phénologiques
      // donc on affiche toutes les données
      commune.phenologie.forEach(pheno => {
        const mois = pheno['Mois Obs']
        const current = monthlyData.get(mois) || 0
        monthlyData.set(mois, current + pheno['Nb Donnees'])
      })

      // Convertir en format pour Nivo
      const lineData: LineData[] = [{
        id: 'Observations',
        data: Array.from(monthlyData.entries()).map(([mois, count]) => ({
          x: MONTH_NAMES[mois - 1],
          y: count
        }))
      }]

      setData(lineData)
      console.log('📅 Données phénologie pour', codeInsee, 'règne:', selectedRegne, ':', lineData)
    }
  }, [communeData, codeInsee, selectedRegne])

  if (data.length === 0 || data[0].data.every(d => d.y === 0)) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📅</div>
          <p>Aucune donnée de phénologie disponible</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveLine
      data={data}
      margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
      xScale={{ type: 'point' }}
      yScale={{
        type: 'linear',
        min: 'auto',
        max: 'auto',
        stacked: false,
        reverse: false
      }}
      yFormat=" >-.0f"
      curve="catmullRom"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Mois',
        legendOffset: 36,
        legendPosition: 'middle'
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Nombre d\'observations',
        legendOffset: -60,
        legendPosition: 'middle'
      }}
      pointSize={8}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabelYOffset={-12}
      useMesh={true}
      colors={{ scheme: 'category10' }}
      animate={true}
      motionConfig="gentle"
      tooltip={({ point }) => (
        <div className="glass rounded-lg p-3 text-sm">
          <div className="font-medium">{point.data.xFormatted}</div>
          <div className="text-gray-600">
            {point.data.yFormatted} observations
          </div>
        </div>
      )}
    />
  )
} 