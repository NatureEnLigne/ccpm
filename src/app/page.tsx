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
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Contenu principal */}
      <div className="flex-1 flex min-h-0 p-4 gap-4 overflow-hover-safe">
        {/* Zone carte avec header et panneau de stats - maintenant à gauche */}
        <div className="flex-1 flex flex-col min-h-0 fade-in-up gap-4" style={{ animationDelay: '0.1s' }}>
          {/* Header moderne avec style cohérent */}
          <div className="container-hover-safe">
            <div className="flex items-center gap-4 fade-in-up">
              {/* Titre principal */}
              <div className="modern-card shadow-xl flex-1">
                <div className="p-3 text-left">
                  <h1 className="text-2xl font-bold mb-1">
                    <span className="text-gradient">Observations naturalistes : Ponthieu-Marquenterre</span>
                  </h1>
                  <p className="species-count-title">
                    Données OpenOBS (Muséum national d'Histoire naturelle)
                  </p>
                </div>
              </div>
              
              {/* Observations */}
              <div className="modern-card shadow-xl">
                <div className="p-3 text-center min-w-[120px]">
                  <div className="text-xl font-bold text-gradient mb-1">
                    {formatNumberFull(globalStats.totalObs)}
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    Observations
                  </div>
                </div>
              </div>
              
              {/* Espèces */}
              <div className="modern-card shadow-xl">
                <div className="p-3 text-center min-w-[120px]">
                  <div className="text-xl font-bold text-gradient mb-1">
                    {formatNumberFull(globalStats.totalEsp)}
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    Espèces
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone carte avec icône plus lisible */}
          <div className="flex-1 relative min-h-0">
            <div className="h-full modern-card overflow-hidden">
              <Map />
              <StatsPanel />
            </div>
          </div>
        </div>

        {/* Sidebar moderne - maintenant à droite */}
        <div className="slide-in-right" style={{ animationDelay: '0.2s' }}>
          <Sidebar />
        </div>
      </div>
    </main>
  )
} 