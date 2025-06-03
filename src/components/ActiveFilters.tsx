'use client'

import { useAppStore } from '../store/useAppStore'
import { X, Filter } from 'lucide-react'

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

const MONTH_NAMES = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
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
    return String(value)
  }
  
  return (
    <div className="glass-card rounded-xl p-4 mb-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-blue-600" />
          <h3 className="text-sm font-medium text-slate-700">
            Filtres actifs ({activeFilterEntries.length})
          </h3>
        </div>
        <button
          onClick={clearFilters}
          className="text-xs text-red-600 hover:text-red-800 transition-colors font-medium px-2 py-1 rounded hover:bg-red-50/50"
        >
          Tout effacer
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {activeFilterEntries.map(([key, value], index) => (
          <div
            key={key}
            className="inline-flex items-center gap-2 glass-light rounded-lg px-3 py-2 text-xs animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className="text-blue-700 font-medium">
              {FILTER_LABELS[key] || key}:
            </span>
            <span className="text-slate-700 font-semibold">
              {formatFilterValue(key, value)}
            </span>
            <button
              onClick={() => removeFilter(key as keyof typeof filters)}
              className="ml-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 rounded-full p-0.5 transition-all"
              title={`Supprimer le filtre ${FILTER_LABELS[key]}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Statistiques des filtres */}
      <div className="mt-3 pt-3 border-t border-white/20">
        <p className="text-xs text-gray-500">
          💡 Cliquez sur un élément des graphiques pour ajouter un filtre
        </p>
      </div>
    </div>
  )
} 