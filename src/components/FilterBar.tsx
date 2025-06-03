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
    <div className="glass rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          🔍 Filtres
        </h3>
        
        {/* Filtre Règne */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">
            Règne :
          </label>
          <select
            value="Tous"
            onChange={(e) => handleRegneChange(e.target.value)}
            className="glass border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
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
    </div>
  )
} 