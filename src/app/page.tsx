'use client'

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
        {/* Zone carte (temporaire) */}
        <div className="flex-1 relative">
          <div className="absolute inset-4 glass rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Carte Mapbox
              </h2>
              <p className="text-gray-600">
                Intégration en cours...
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 p-4">
          <div className="glass rounded-2xl p-6 h-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              🏘️ Communes CCPM
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-white/30 rounded-lg">
                <p className="font-medium">Chargement...</p>
                <p className="text-sm text-gray-600">En cours d'initialisation</p>
              </div>
            </div>
            
            {/* Controls temporaires */}
            <div className="mt-8 space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Afficher bâtiments 3D</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fond de carte
                </label>
                <select className="w-full p-2 rounded-lg bg-white/30 border border-white/50">
                  <option>Satellite</option>
                  <option>Terrain</option>
                  <option>Rues</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
} 