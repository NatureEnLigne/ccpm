'use client'

import Map from '../components/Map'
import Sidebar from '../components/Sidebar'
import StatsPanel from '../components/StatsPanel'

export default function HomePage() {
  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="glass z-10 p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 text-shadow">
            📍 CCPM - Cartographie Ponthieu-Marquenterre
          </h1>
          <p className="text-gray-600 mt-1">
            Visualisation interactive des données naturalistes
          </p>
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