'use client'

import { useAppStore } from '../store/useAppStore'
import { X } from 'lucide-react'

const FILTER_LABELS: Record<string, string> = {
  selectedGroupe: 'Groupe',
  selectedMois: 'Mois',
  selectedStatut: 'Statut',
  selectedRegne: 'Règne',
  selectedOrdre: 'Ordre',
  selectedFamille: 'Famille',
  selectedAnnee: 'Année',
  selectedRedListCategory: 'Liste Rouge',
  selectedStatutReglementaire: 'Statut Réglementaire'
}

export default function ActiveFilters() {
  const { filters, removeFilter, clearFilters } = useAppStore()
  
  const activeFilterEntries = Object.entries(filters).filter(
    ([key, value]) => value !== null && key !== 'activeFilters'
  )
  
  if (activeFilterEntries.length === 0) {
    return null
  }
  
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/30 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-700">Filtres actifs</h3>
        <button
          onClick={clearFilters}
          className="text-xs text-red-600 hover:text-red-800 transition-colors"
        >
          Tout effacer
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {activeFilterEntries.map(([key, value]) => (
          <div
            key={key}
            className="inline-flex items-center gap-1 bg-blue-100/60 backdrop-blur-sm border border-blue-200/50 rounded-lg px-2 py-1 text-xs"
          >
            <span className="text-blue-700 font-medium">
              {FILTER_LABELS[key] || key}:
            </span>
            <span className="text-blue-600">{value}</span>
            <button
              onClick={() => removeFilter(key as keyof typeof filters)}
              className="ml-1 text-blue-500 hover:text-blue-700 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 