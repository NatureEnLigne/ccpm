'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Map from '../components/Map'
import Sidebar from '../components/Sidebar'
import StatsPanel from '../components/StatsPanel'
import ToggleSwitch from '../components/ToggleSwitch'
import { useAppStore } from '../store/useAppStore'
import { formatNumberFull } from '../utils/formatters'
import { MAPBOX_CONFIG } from '../config/mapbox'

export default function HomePage() {
  const { 
    communeData,
    selectedCommune,
    setSelectedCommune,
    showCommunes,
    setShowCommunes,
    show3D,
    setShow3D,
    mapStyle,
    setMapStyle
  } = useAppStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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

  // Logique de sélection automatique de commune
  const matchingCommune = useMemo(() => {
    if (!communeData || !searchTerm.trim()) return null
    
    // Recherche exacte d'abord
    const exactMatch = Array.from(communeData.entries()).find(([, commune]) => 
      commune.nom && commune.nom.toLowerCase() === searchTerm.toLowerCase().trim()
    )
    
    if (exactMatch) {
      return exactMatch
    }
    
    // Recherche partielle si pas de correspondance exacte
    const partialMatches = Array.from(communeData.entries())
      .filter(([, commune]) => 
        commune.nom && commune.nom.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
      .sort((a, b) => (a[1].nom || '').localeCompare(b[1].nom || ''))
    
    return partialMatches.length === 1 ? partialMatches[0] : null
  }, [communeData, searchTerm])

  // Sélection automatique de la commune si correspondance unique
  useEffect(() => {
    if (matchingCommune && matchingCommune[0] !== selectedCommune) {
      setSelectedCommune(matchingCommune[0])
    } else if (!matchingCommune && searchTerm.trim() && selectedCommune) {
      // Désélectionner si plus de correspondance
      const currentCommune = communeData?.get(selectedCommune)
      if (!currentCommune?.nom?.toLowerCase().includes(searchTerm.toLowerCase().trim())) {
        setSelectedCommune(null)
      }
    }
  }, [matchingCommune, selectedCommune, searchTerm, communeData, setSelectedCommune])

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Layout Desktop - visible jusqu'à 1280x720 */}
      <div className="hidden min-[1280px]:flex flex-1 min-h-0 p-4 gap-4 overflow-hover-safe">
        {/* Zone carte avec header et panneau de stats - maintenant à gauche */}
        <div className="flex-1 flex flex-col min-h-0 fade-in-up gap-4" style={{ animationDelay: '0.1s' }}>
          {/* Header moderne avec style cohérent */}
          <div className="container-hover-safe">
            <div className="flex items-center gap-4 fade-in-up">
              {/* Titre principal */}
              <div className="modern-card shadow-xl flex-1">
                <div className="p-3 text-left">
                  <h1 className="text-2xl font-bold mb-1">
                    <span className="text-gradient whitespace-nowrap">Observations naturalistes : Ponthieu-Marquenterre</span>
                  </h1>
                  <p className="data-label-unified text-xl">
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
                  <div className="data-label-unified text-lg">
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
                  <div className="data-label-unified text-lg">
                    Espèces
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone carte avec icône plus lisible */}
          <div className="flex-1 relative min-h-0">
            <div className="h-full modern-card shadow-xl overflow-hidden">
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

      {/* Layout Mobile - visible en dessous de 1280px */}
      <div className="flex min-[1280px]:hidden flex-col h-full">
        {/* Header Mobile */}
        <div className="flex-shrink-0 p-4 space-y-4">
          {/* Ligne 1 : Titre et description */}
          <div className="modern-card shadow-xl">
            <div className="p-3 text-center">
              <h1 className="text-lg font-bold mb-1">
                <span className="text-gradient">Observations naturalistes : Ponthieu-Marquenterre</span>
              </h1>
              <p className="data-label-unified text-sm">
                Données OpenOBS (Muséum national d'Histoire naturelle)
              </p>
            </div>
          </div>
          
          {/* Ligne 2 : Stats et Menu Hamburger */}
          <div className="flex gap-4">
            {/* Observations */}
            <div className="modern-card shadow-xl flex-1">
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-gradient mb-1">
                  {formatNumberFull(globalStats.totalObs)}
                </div>
                <div className="data-label-unified text-sm">
                  Observations
                </div>
              </div>
            </div>
            
            {/* Espèces */}
            <div className="modern-card shadow-xl flex-1">
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-gradient mb-1">
                  {formatNumberFull(globalStats.totalEsp)}
                </div>
                <div className="data-label-unified text-sm">
                  Espèces
                </div>
              </div>
            </div>

            {/* Menu Hamburger */}
            <div className="modern-card shadow-xl">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-3 text-center min-w-[60px] h-full flex flex-col items-center justify-center gap-1"
              >
                <div className="text-lg">☰</div>
                <div className="data-label-unified text-xs">Menu</div>
              </button>
            </div>
          </div>
        </div>

        {/* Zone carte */}
        <div className="flex-1 relative min-h-0 p-4 pt-0">
          <div className="h-full modern-card shadow-xl overflow-hidden">
            <Map />
            <StatsPanel />
            
            {/* Menu mobile en overlay */}
            {isMobileMenuOpen && (
              <div className="absolute inset-4 z-50">
                {/* Panel menu glassmorphique pleine largeur */}
                <div className="modern-card shadow-2xl h-full overflow-hidden">
                  <div className="h-full flex flex-col">
                    {/* Header du menu */}
                    <div className="flex-shrink-0 p-4 border-b border-white/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏛️</span>
                        <span className="font-bold text-gradient">Communes CCPM</span>
                      </div>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Contenu du menu - Zone de sélection commune */}
                    <div className="flex-1 min-h-0 p-4 flex flex-col">
                      {/* Champ de recherche */}
                      <div className="flex-shrink-0 mb-4">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                          <input
                            type="text"
                            placeholder="Nom de la commune"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-full pl-10 pr-4"
                            style={{
                              background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))'
                            }}
                          />
                        </div>
                      </div>

                      {/* Zone d'affichage de la commune sélectionnée */}
                      <div className="flex-1 flex items-center justify-center">
                        {selectedCommune && communeData?.get(selectedCommune) ? (
                          <div className="text-center p-6 bg-white/30 rounded-xl border border-white/20">
                            <div className="text-4xl mb-3">🏘️</div>
                            <h3 className="font-bold text-lg text-gradient mb-2">
                              {communeData.get(selectedCommune)?.nom || selectedCommune}
                            </h3>
                            <div className="flex items-center justify-center gap-4 text-sm opacity-80">
                              <span className="flex items-center gap-1">
                                <span>👁️</span>
                                {communeData.get(selectedCommune)?.totalObs || 0} obs.
                              </span>
                              <span className="flex items-center gap-1">
                                <span>🦋</span>
                                {communeData.get(selectedCommune)?.totalEsp || 0} esp.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500">
                            <div className="text-4xl mb-3">🗺️</div>
                            <p className="text-sm">
                              {searchTerm ? 'Saisissez le nom complet d\'une commune' : 'Sélectionnez une commune pour voir ses détails'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Section Couches */}
                    <div className="flex-shrink-0 p-4 border-t border-white/20 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">🗺️</span>
                        <span className="font-bold text-gradient">Couches</span>
                      </div>
                      
                      {/* Toggles sur la même ligne pour gagner de la place */}
                      <div className="flex gap-4">
                        <ToggleSwitch
                          label="Communes"
                          checked={showCommunes}
                          onChange={setShowCommunes}
                        />
                        <ToggleSwitch
                          label="Bâtiments 3D"
                          checked={show3D}
                          onChange={setShow3D}
                        />
                      </div>

                      {/* Sélecteur de fonds de plan */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <span className="text-lg">🌍</span>
                          <span className="text-gradient">Fonds de plan</span>
                        </label>
                        <select
                          value={mapStyle}
                          onChange={(e) => setMapStyle(e.target.value)}
                          className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-full"
                          style={{
                            background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))',
                            color: '#2d5016'
                          }}
                        >
                          {Object.entries(MAPBOX_CONFIG.styles).map(([key, label]) => (
                            <option key={key} value={key} style={{ color: '#333' }}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
} 