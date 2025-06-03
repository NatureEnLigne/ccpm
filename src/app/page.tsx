'use client'

import Map from '../components/Map'
import Sidebar from '../components/Sidebar'

export default function HomePage() {
  return (
    <main className="h-screen w-full flex flex-col">
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
      <div className="flex-1 flex">
        {/* Zone carte */}
        <div className="flex-1 relative p-4">
          <Map />
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>
    </main>
  )
} 