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
    <main className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="glass z-10 p-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 text-shadow">
                📍 CCPM - Cartographie Ponthieu-Marquenterre
              </h1>
              <p className="text-gray-600 mt-1">
                Visualisation interactive des données naturalistes
              </p>
            </div>
            
            {/* Stats rapides CCPM */}
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumberFull(globalStats.totalObs)}
                </div>
                <div className="text-sm text-gray-600">Observations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumberFull(globalStats.totalEsp)}
                </div>
                <div className="text-sm text-gray-600">Espèces</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 flex min-h-0">
        {/* Zone carte avec panneau de stats - prend tout l'espace disponible */}
        <div className="flex-1 p-4 relative">
          <Map />
          <StatsPanel />
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>
    </main>
  )
} 