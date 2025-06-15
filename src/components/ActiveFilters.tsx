'use client'

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
  selectedStatutReglementaire: 'Statut Réglementaire'
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function ActiveFilters() {
  const { filters, removeFilter, clearFilters } = useAppStore()
  
  const activeFilterEntries = Object.entries(filters).filter(
    ([key, value]) => value !== null && key !== 'activeFilters'
  )
  
  if (activeFilterEntries.length === 0) {
    return null
  }

  const formatFilterValue = (key: string, value: any) => {
    if (key === 'selectedMois' && typeof value === 'number') {
      return MONTH_NAMES[value - 1] || value
    }
    return value
  }
  
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/30 p-4 mb-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <span className="text-sm">✨</span>
          <span className="text-gradient">Filtres actifs</span>
        </h3>
        <button
          onClick={clearFilters}
          className="text-xs px-3 py-1 rounded-full text-white font-medium transition-all hover:shadow-lg"
          style={{
            background: 'linear-gradient(45deg, #2d5016, #cd853f)',
            opacity: 0.9
          }}
        >
          Tout effacer
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
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
    </div>
  )
} 