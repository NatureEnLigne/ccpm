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
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  // Suggestions de communes basées sur la recherche
  const suggestions = useMemo(() => {
    if (!communeData || !searchTerm.trim() || searchTerm.trim().length < 2) {
      return []
    }
    
    const searchLower = searchTerm.toLowerCase().trim()
    
    return Array.from(communeData.entries())
      .filter(([, commune]) => 
        commune.nom && commune.nom.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => {
        const aName = a[1].nom || ''
        const bName = b[1].nom || ''
        
        // Priorité aux correspondances qui commencent par le terme recherché
        const aStartsWith = aName.toLowerCase().startsWith(searchLower)
        const bStartsWith = bName.toLowerCase().startsWith(searchLower)
        
        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1
        
        // Puis tri alphabétique
        return aName.localeCompare(bName)
      })
      .slice(0, 8) // Limiter à 8 suggestions max
  }, [communeData, searchTerm])

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

  // Gérer la sélection d'une suggestion
  const handleSuggestionClick = (codeInsee: string, communeName: string) => {
    setSearchTerm(communeName)
    setSelectedCommune(codeInsee)
    setShowSuggestions(false)
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Layout Desktop - visible au-dessus de 1280px avec optimisation hauteur */}
      <div className="hidden min-[1280px]:flex flex-1 min-h-0 p-2 gap-3 overflow-hidden">
        {/* Zone carte avec header et panneau de stats - maintenant à gauche */}
        <div className="flex-1 flex flex-col min-h-0 fade-in-up gap-2" style={{ animationDelay: '0.1s' }}>
          {/* Header moderne avec style cohérent - hauteur réduite */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 fade-in-up">
              {/* Titre principal - taille augmentée */}
              <div className="modern-card shadow-xl flex-1">
                <div className="p-3 text-left">
                  <h1 className="text-xl font-bold mb-1 leading-tight">
                    <span className="text-gradient">Observations naturalistes : Ponthieu-Marquenterre</span>
                  </h1>
                  <p className="data-label-unified text-base leading-tight">
                    Données OpenOBS (Muséum national d'Histoire naturelle)
                  </p>
                </div>
              </div>
                  
              {/* Observations - taille réduite */}
              <div className="modern-card shadow-xl">
                <div className="p-2 text-center min-w-[100px]">
                  <div className="text-lg font-bold text-gradient mb-0.5">
                    {formatNumberFull(globalStats.totalObs)}
                  </div>
                  <div className="data-label-unified text-sm">
                    Observations
                  </div>
                </div>
              </div>
              
              {/* Espèces - taille réduite */}
              <div className="modern-card shadow-xl">
                <div className="p-2 text-center min-w-[100px]">
                  <div className="text-lg font-bold text-gradient mb-0.5">
                    {formatNumberFull(globalStats.totalEsp)}
                  </div>
                  <div className="data-label-unified text-sm">
                    Espèces
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone carte - s'adapte à l'espace restant */}
          <div className="flex-1 relative min-h-0 overflow-hidden">
            <div className="h-full modern-card shadow-xl overflow-hidden">
              <Map />
              <StatsPanel />
            </div>
          </div>
        </div>

        {/* Sidebar moderne - maintenant à droite avec largeur fixe optimisée */}
        <div className="slide-in-right w-80 flex-shrink-0" style={{ animationDelay: '0.2s' }}>
          <Sidebar />
        </div>
      </div>

      {/* Layout Mobile - visible en dessous de 1280px */}
      <div className="flex min-[1280px]:hidden flex-col h-full">
        {/* Header Mobile */}
        <div className="flex-shrink-0 p-4 space-y-4">
          {/* Ligne 1 : Titre et description */}
          <div className="modern-card shadow-xl">
            <div className="p-4 text-center">
              <h1 className="text-xl font-bold mb-2">
                <span className="text-gradient">Observations naturalistes : Ponthieu-Marquenterre</span>
              </h1>
              <p className="data-label-unified text-base">
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
                    <div className="flex-1 min-h-0 p-4 flex flex-col overflow-hidden">
                      {/* Champ de recherche avec suggestions */}
                      <div className="flex-shrink-0 mb-4 relative">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                          <input
                            type="text"
                            placeholder="Nom de la commune"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value)
                              setShowSuggestions(e.target.value.trim().length >= 2)
                            }}
                            onFocus={() => setShowSuggestions(searchTerm.trim().length >= 2)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-full pl-10 pr-4"
                            style={{
                              background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))'
                            }}
                          />
                        </div>
                        
                        {/* Liste des suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white/95 backdrop-blur-sm border border-amber-200/50 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map(([codeInsee, commune]) => (
                              <button
                                key={codeInsee}
                                onClick={() => handleSuggestionClick(codeInsee, commune.nom || '')}
                                className="w-full text-left px-4 py-2 hover:bg-amber-100/50 transition-colors duration-150 flex items-center gap-3 text-sm border-b border-amber-100/30 last:border-b-0"
                              >
                                <span className="text-base">🏘️</span>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800">{commune.nom}</div>
                                  <div className="text-xs text-gray-500">
                                    {commune.totalObs} observations • {commune.totalEsp} espèces
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Zone d'affichage de la commune sélectionnée - responsive */}
                      <div className="flex-1 min-h-0 overflow-y-auto">
                        {selectedCommune && communeData?.get(selectedCommune) ? (
                          <div className="w-full p-3 sm:p-4 bg-white/30 rounded-xl border border-white/20 h-fit">
                            <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="text-xl sm:text-2xl flex-shrink-0">🏘️</div>
                                <h3 className="font-bold text-base sm:text-lg text-gradient truncate">
                                  {communeData.get(selectedCommune)?.nom || selectedCommune}
                                </h3>
                              </div>
                              <button
                                onClick={() => {
                                  window.open(`/commune/${selectedCommune}/`, '_blank')
                                }}
                                className="p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium flex-shrink-0"
                                title="Ouvrir la fiche commune"
                              >
                                <span className="text-base sm:text-lg">📋</span>
                                <span className="hidden min-[400px]:inline">Fiche</span>
                              </button>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-2 sm:gap-4">
                              <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center gap-2 min-[400px]:gap-4 opacity-80">
                                <span className="flex items-center gap-1.5">
                                  <span className="text-xs sm:text-sm">👁️</span>
                                  <span className="font-medium text-xs sm:text-sm">{communeData.get(selectedCommune)?.totalObs || 0}</span>
                                  <span className="hidden min-[400px]:inline text-xs">observations</span>
                                  <span className="min-[400px]:hidden text-xs">obs.</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="text-xs sm:text-sm">🦋</span>
                                  <span className="font-medium text-xs sm:text-sm">{communeData.get(selectedCommune)?.totalEsp || 0}</span>
                                  <span className="hidden min-[400px]:inline text-xs">espèces</span>
                                  <span className="min-[400px]:hidden text-xs">esp.</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full text-center text-gray-500 py-6 sm:py-8">
                            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🗺️</div>
                            <p className="text-xs sm:text-sm px-2">
                              {searchTerm.length >= 2 && suggestions.length === 0 ? 
                                'Aucune commune trouvée' : 
                                searchTerm ? 'Tapez au moins 2 caractères pour voir les suggestions' : 
                                'Sélectionnez une commune pour voir ses détails'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Section Couches - responsive avec hauteur adaptative */}
                    <div className="flex-shrink-0 border-t border-white/20">
                      {/* Version compacte pour très petits écrans (< 505px) */}
                      <div className="max-[504px]:block hidden p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🗺️</span>
                          <span className="font-bold text-gradient text-sm">Couches</span>
                        </div>
                        
                        {/* Toggles compacts */}
                        <div className="flex gap-3 text-xs">
                          <ToggleSwitch
                            label="Communes"
                            checked={showCommunes}
                            onChange={setShowCommunes}
                          />
                          <ToggleSwitch
                            label="3D"
                            checked={show3D}
                            onChange={setShow3D}
                          />
                        </div>

                        {/* Sélecteur compact */}
                        <div>
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                            <span className="text-sm">🌍</span>
                            <span className="text-gradient">Fond</span>
                          </label>
                          <select
                            value={mapStyle}
                            onChange={(e) => setMapStyle(e.target.value)}
                            className="rounded-lg border border-amber-200/50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-full"
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

                      {/* Version normale pour écrans moyens (505px - 635px) */}
                      <div className="min-[505px]:max-[635px]:block hidden p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">🗺️</span>
                          <span className="font-bold text-gradient">Couches</span>
                        </div>
                        
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

                        <div>
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

                      {/* Version étendue pour grands écrans (> 635px) */}
                      <div className="min-[636px]:block hidden p-4 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xl">🗺️</span>
                          <span className="font-bold text-gradient">Couches</span>
                        </div>
                        
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
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
} 