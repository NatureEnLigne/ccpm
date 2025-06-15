'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export default function FilterBar() {
  const { speciesData, setFilter } = useAppStore()
  const [availableRegnes, setAvailableRegnes] = useState<string[]>([])

  useEffect(() => {
    if (speciesData) {
      // Récupérer tous les règnes disponibles depuis les données réelles
      const regnes = new Set<string>()
      
      speciesData.forEach(species => {
        // Utiliser le vrai règne depuis les données taxonomiques
        const regne = species.regne || 'Inconnu'
        regnes.add(regne)
      })
      
      const regnesList = Array.from(regnes).sort()
      setAvailableRegnes(regnesList)
      
      console.log('🔍 Règnes détectés depuis les données:', regnesList)
    }
  }, [speciesData])

  const handleRegneChange = (regne: string) => {
    if (regne !== 'Tous') {
      setFilter('selectedRegne', regne, 'FilterBar')
    }
  }

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-lg border border-white/30 p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="text-gradient">Filtres</span>
        </h3>
        <div className="text-xs font-medium opacity-75">Filter</div>
      </div>
      
      {/* Filtre Règne */}
      <div className="flex items-center space-x-3">
        <select
          value="Tous"
          onChange={(e) => handleRegneChange(e.target.value)}
          className="bg-white/10 backdrop-blur-md border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 text-gray-700"
        >
          <option value="Tous">Tous les règnes</option>
          {availableRegnes.map(regne => (
            <option key={regne} value={regne}>
              {regne}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
} 