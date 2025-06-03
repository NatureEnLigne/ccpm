'use client'

import { useMemo } from 'react'
import Map from '../components/Map'
import Sidebar from '../components/Sidebar'
import StatsPanel from '../components/StatsPanel'
import { useAppStore } from '../store/useAppStore'
import { formatNumberFull } from '../utils/formatters'

export default function HomePage() {
  const { communeData } = useAppStore()

  // Calculer les statistiques globales CCPM
  const globalStats = useMemo(() => {
    if (!communeData) {
      return { totalObs: 0, totalEsp: 0 }
    }

    let totalObservations = 0
    const uniqueSpecies = new Set<string>()

    // Parcourir toutes les communes pour calculer les totaux
    Array.from(communeData.values()).forEach(commune => {
      totalObservations += commune.totalObs
      
      // Compter les espèces uniques à travers toutes les communes
      commune.observations.forEach(obs => {
        uniqueSpecies.add(obs['Cd Ref'])
      })
    })

    return {
      totalObs: totalObservations,
      totalEsp: uniqueSpecies.size
    }
  }, [communeData])

  return (
    <main className="h-screen flex flex-col">
      {/* Header moderne */}
      <header className="modern-card z-10 m-4 mb-0 shadow-xl fade-in-up">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="fade-in-scale">
              <h1 className="text-3xl font-bold text-gradient mb-2">
                📍 CCPM Cartographie
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Ponthieu-Marquenterre • Données Naturalistes
              </p>
            </div>
            
            {/* Stats rapides modernes */}
            <div className="flex space-x-8 fade-in-scale">
              <div className="text-center">
                <div className="relative">
                  <div className="text-4xl font-bold text-gradient mb-1">
                    {formatNumberFull(globalStats.totalObs)}
                  </div>
                  <div className="badge-modern">
                    <span className="w-2 h-2 bg-white rounded-full opacity-80"></span>
                    Observations
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="relative">
                  <div className="text-4xl font-bold text-gradient mb-1">
                    {formatNumberFull(globalStats.totalEsp)}
                  </div>
                  <div className="badge-success">
                    <span className="w-2 h-2 bg-white rounded-full opacity-80"></span>
                    Espèces
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 flex min-h-0 p-4 gap-4">
        {/* Zone carte avec panneau de stats */}
        <div className="flex-1 relative fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="h-full modern-card overflow-hidden">
            <Map />
            <StatsPanel />
          </div>
        </div>

        {/* Sidebar moderne */}
        <div className="slide-in-right" style={{ animationDelay: '0.2s' }}>
          <Sidebar />
        </div>
      </div>
    </main>
  )
} 