'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Map from '../components/Map'
import Sidebar from '../components/Sidebar'
import StatsPanel from '../components/StatsPanel'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAppStore } from '../store/useAppStore'

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isLoading } = useAppStore()

  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
      {/* Header responsive */}
      <header className="glass-strong z-20 p-3 md:p-4 shadow-lg animate-slide-up">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-gray-800 text-shadow truncate">
              📍 CCPM - Cartographie Ponthieu-Marquenterre
            </h1>
            <p className="text-gray-600 text-sm hidden sm:block">
              Visualisation interactive des données naturalistes
            </p>
          </div>
          
          {/* Bouton menu mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden glass-button p-2 ml-4"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Zone carte avec panneau de stats */}
        <div className="flex-1 p-2 md:p-4 relative animate-fade-in">
          {isLoading ? (
            <div className="h-full flex items-center justify-center glass-card rounded-2xl">
              <LoadingSpinner 
                size="lg" 
                text="Chargement de la carte..." 
              />
            </div>
          ) : (
            <>
              <Map />
              <StatsPanel />
            </>
          )}
        </div>

        {/* Sidebar - comportement responsive */}
        <div className={`
          fixed lg:relative top-0 right-0 h-full z-30 lg:z-10
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          lg:w-80 w-80 sm:w-96
        `}>
          <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* Overlay mobile */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/30 z-20 animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </main>
  )
} 