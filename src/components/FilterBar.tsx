'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { X } from 'lucide-react'
import { translateRegne } from '../utils/formatters'

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



interface FilterBarProps {
  noBottomMargin?: boolean
  compactPadding?: boolean
}

export default function FilterBar({ noBottomMargin = false, compactPadding = false }: FilterBarProps) {
  const { speciesData, setFilter, filters, removeFilter, clearFilters } = useAppStore()
  const [availableRegnes, setAvailableRegnes] = useState<string[]>([])
  const [availableRedListCategories, setAvailableRedListCategories] = useState<string[]>([])
  const [availableStatutsReglementaires, setAvailableStatutsReglementaires] = useState<string[]>([])

  useEffect(() => {
    if (speciesData) {
      // Récupérer tous les règnes disponibles depuis les données réelles
      const regnes = new Set<string>()
      const redListCategories = new Set<string>()
      const statutsReglementaires = new Set<string>()
      
      speciesData.forEach(species => {
        // Utiliser le vrai règne depuis les données taxonomiques
        const regne = species.regne || 'Inconnu'
        regnes.add(regne)
        
        // Récupérer les statuts de liste rouge
        if (species.listeRouge) {
          const statut = species.listeRouge['Label Statut']
          if (statut) {
            redListCategories.add(statut)
          }
        } else {
          redListCategories.add('Non évalué')
        }
        
        // Récupérer les statuts réglementaires
        if (species.statuts && species.statuts.length > 0) {
          species.statuts.forEach(statut => {
            const statutLabel = statut['LABEL STATUT (statuts)']
            if (statutLabel) {
              statutsReglementaires.add(statutLabel)
            }
          })
        } else {
          statutsReglementaires.add('Non réglementé')
        }
      })
      
      const regnesList = Array.from(regnes).sort()
      const redListList = Array.from(redListCategories).sort()
      const statutsList = Array.from(statutsReglementaires).sort()
      
      setAvailableRegnes(regnesList)
      setAvailableRedListCategories(redListList)
      setAvailableStatutsReglementaires(statutsList)
      
      console.log('🔍 Règnes détectés:', regnesList)
      console.log('🚨 Statuts liste rouge détectés:', redListList)
      console.log('⚖️ Statuts réglementaires détectés:', statutsList)
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

  const handleRedListCategoryChange = (category: string) => {
    if (category !== 'Tous') {
      setFilter('selectedRedListCategory', category, 'FilterBar')
    }
  }

  const handleStatutReglementaireChange = (statut: string) => {
    if (statut !== 'Tous') {
      setFilter('selectedStatutReglementaire', statut, 'FilterBar')
    }
  }

  const activeFilterEntries = Object.entries(filters).filter(
    ([key, value]) => value !== null && key !== 'activeFilters'
  )

  const formatFilterValue = (key: string, value: any) => {
    console.log(`🎨 formatFilterValue appelé avec:`, { key, value, valueType: typeof value, rawValue: JSON.stringify(value) })
    
    if (key === 'selectedMois' && typeof value === 'number') {
      const result = MONTH_NAMES[value - 1] || value
      console.log(`🎨 formatFilterValue mois résultat:`, { key, value, result })
      return result
    }
    
    if (key === 'selectedRegne' && typeof value === 'string') {
      const result = translateRegne(value)
      console.log(`🎨 formatFilterValue règne résultat:`, { key, value, result })
      return result
    }
    
    // Vérifier si la valeur est null, undefined ou une chaîne vide
    if (value === null || value === undefined || value === '') {
      console.log(`🎨 formatFilterValue valeur vide:`, { key, value })
      return 'Valeur vide'
    }
    
    // Retourner la valeur telle quelle pour tous les autres cas
    const result = String(value)
    console.log(`🎨 formatFilterValue résultat final:`, { key, value, result, stringified: JSON.stringify(value) })
    return result
  }

  return (
    <div className={`modern-card z-filters shadow-xl fade-in-up ${noBottomMargin ? '' : 'mb-8'} ${compactPadding ? 'p-3' : ''}`}>
      {/* Première ligne : Titre et contrôles alignés */}
      <div className="flex items-center justify-between gap-4 min-h-[72px]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <span className="text-xl font-bold text-gradient">Filtres</span>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value="Tous"
            onChange={(e) => handleRegneChange(e.target.value)}
            className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))',
              color: '#cd853f'
            }}
          >
            <option value="Tous" style={{ color: '#333' }}>Tous les règnes</option>
            {availableRegnes.map(regne => (
              <option key={regne} value={regne} style={{ color: '#333' }}>
                {translateRegne(regne)}
              </option>
            ))}
          </select>
          
          <select
            value="Tous"
            onChange={(e) => handleRedListCategoryChange(e.target.value)}
            className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))',
              color: '#cd853f'
            }}
          >
            <option value="Tous" style={{ color: '#333' }}>Statuts listes rouges</option>
            {availableRedListCategories.map(category => (
              <option key={category} value={category} style={{ color: '#333' }}>
                {category}
              </option>
            ))}
          </select>
          
          <select
            value="Tous"
            onChange={(e) => handleStatutReglementaireChange(e.target.value)}
            className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-52"
            style={{
              background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))',
              color: '#cd853f'
            }}
          >
            <option value="Tous" style={{ color: '#333' }}>Statuts réglementaires</option>
            {availableStatutsReglementaires.map(statut => (
              <option key={statut} value={statut} style={{ color: '#333' }}>
                {statut}
              </option>
            ))}
          </select>
          
          <input
            type="number"
            placeholder="A partir de l'année"
            value={filters.anneeDebut || ''}
            onChange={(e) => handleAnneeDebutChange(e.target.value)}
            className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-44 placeholder-amber-600"
            style={{
              background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))',
              color: '#cd853f'
            }}
            min="1900"
            max="2030"
          />
          
          <input
            type="number"
            placeholder="Jusque l'année"
            value={filters.anneeFin || ''}
            onChange={(e) => handleAnneeFinChange(e.target.value)}
            className="rounded-xl border border-amber-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium w-36 placeholder-amber-600"
            style={{
              background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))',
              color: '#cd853f'
            }}
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