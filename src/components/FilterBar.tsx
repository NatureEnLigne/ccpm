'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { X } from 'lucide-react'

const FILTER_LABELS: Record<string, string> = {
  selectedGroupe: 'Groupe',
  selectedGroup2: 'Sous-groupe',
  selectedMois: 'Mois',
  selectedStatut: 'Statut',
  selectedRegne: 'Règne',
  selectedOrdre: 'Ordre',
  selectedFamille: 'Famille',
  selectedAnnee: 'Année',
  selectedRedListCategory: 'Liste Rouge',
  selectedStatutReglementaire: 'Statut Réglementaire',
  anneeDebut: 'A partir de',
  anneeFin: 'Jusqu\'à'
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function FilterBar() {
  const { speciesData, setFilter, filters, removeFilter, clearFilters } = useAppStore()
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

  const handleAnneeDebutChange = (value: string) => {
    const year = value ? parseInt(value, 10) : null
    if (year && !isNaN(year)) {
      setFilter('anneeDebut', year, 'FilterBar')
    } else if (!value) {
      setFilter('anneeDebut', null, 'FilterBar')
    }
  }

  const handleAnneeFinChange = (value: string) => {
    const year = value ? parseInt(value, 10) : null
    if (year && !isNaN(year)) {
      setFilter('anneeFin', year, 'FilterBar')
    } else if (!value) {
      setFilter('anneeFin', null, 'FilterBar')
    }
  }

  const activeFilterEntries = Object.entries(filters).filter(
    ([key, value]) => value !== null && key !== 'activeFilters'
  )

  const formatFilterValue = (key: string, value: any) => {
    if (key === 'selectedMois' && typeof value === 'number') {
      return MONTH_NAMES[value - 1] || value
    }
    return value
  }

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-lg border border-white/30 p-4 mb-6 shadow-lg">
      {/* Première ligne : Titre et contrôles alignés */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="text-lg font-bold text-gradient">Filtres</span>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <input
            type="number"
            placeholder="A partir de l'année"
            value={filters.anneeDebut || ''}
            onChange={(e) => handleAnneeDebutChange(e.target.value)}
            className="bg-white/10 backdrop-blur-md border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 text-gray-700 w-36"
            min="1900"
            max="2030"
          />
          
          <input
            type="number"
            placeholder="Jusque l'année"
            value={filters.anneeFin || ''}
            onChange={(e) => handleAnneeFinChange(e.target.value)}
            className="bg-white/10 backdrop-blur-md border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 text-gray-700 w-36"
            min="1900"
            max="2030"
          />
        </div>
      </div>

      {/* Deuxième ligne : Filtres actifs (si il y en a) */}
      {activeFilterEntries.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 flex-1">
            {activeFilterEntries.map(([key, value], index) => {
              // Calculer la couleur basée sur l'index pour variation
              const ratio = activeFilterEntries.length === 1 ? 0.5 : index / (activeFilterEntries.length - 1)
              const startColor = { r: 45, g: 80, b: 22 }       // #2d5016 (vert foncé)
              const endColor = { r: 205, g: 133, b: 63 }       // #cd853f (marron doré)
              
              const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio)
              const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio)
              const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio)
              const bgColor = `rgb(${r}, ${g}, ${b})`
              
              return (
                <div
                  key={key}
                  className="inline-flex items-center gap-1 backdrop-blur-sm border border-white/30 rounded-lg px-2 py-1 text-xs text-white"
                  style={{ backgroundColor: bgColor, opacity: 0.9 }}
                >
                  <span className="font-medium">
                    {FILTER_LABELS[key] || key}:
                  </span>
                  <span className="opacity-90">{formatFilterValue(key, value)}</span>
                  <button
                    onClick={() => removeFilter(key as keyof typeof filters)}
                    className="ml-1 text-white/80 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </div>
          
          <button
            onClick={clearFilters}
            className="text-xs px-3 py-1 rounded-full text-white font-medium transition-all hover:shadow-lg flex-shrink-0"
            style={{
              background: 'linear-gradient(45deg, #2d5016, #cd853f)',
              opacity: 0.9
            }}
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  )
} 