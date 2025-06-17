import { create } from 'zustand'
import type { CommuneCollection, FilterState, HoverState, FilterEvent } from '../types'
import type { CommuneData, SpeciesData } from '../utils/dataJoiner'

interface AppState {
  // État de la carte
  selectedCommune: string | null
  communes: CommuneCollection | null
  isLoading: boolean
  show3D: boolean
  showCommunes: boolean
  mapStyle: string
  
  // Données jointes
  communeData: Map<string, CommuneData> | null
  speciesData: Map<string, SpeciesData> | null
  
  // Filtres étendus
  filters: FilterState
  
  // État des interactions croisées
  hoverState: HoverState
  
  // Panneau de statistiques
  showStatsPanel: boolean
  statsPanelCommune: string | null
  
  // Actions
  setSelectedCommune: (insee: string | null) => void
  setCommunes: (communes: CommuneCollection) => void
  setLoading: (loading: boolean) => void
  setShow3D: (show: boolean) => void
  setShowCommunes: (show: boolean) => void
  setMapStyle: (style: string) => void
  setCommuneData: (data: Map<string, CommuneData>) => void
  setSpeciesData: (data: Map<string, SpeciesData>) => void
  
  // Action pour réinitialiser la vue carte
  resetMapView: () => void
  
  // Actions de filtres étendues
  setFilter: (filterType: keyof FilterState, value: string | number | null, source?: string) => void
  removeFilter: (filterType: keyof FilterState) => void
  clearFilters: () => void
  resetFiltersOnCommuneChange: () => void
  applyFilterEvent: (event: FilterEvent) => void
  
  // Actions d'interaction
  setHoverState: (state: HoverState) => void
  clearHoverState: () => void
  
  setShowStatsPanel: (show: boolean) => void
  setStatsPanelCommune: (insee: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // État initial
  selectedCommune: null,
  communes: null,
  isLoading: true,
  show3D: false,
  showCommunes: true,
  mapStyle: 'satellite-streets-v12',
  communeData: null,
  speciesData: null,
  filters: {
    selectedGroupe: null,
    selectedGroup2: null,
    selectedMois: null,
    selectedStatut: null,
    selectedRegne: null,
    selectedOrdre: null,
    selectedFamille: null,
    selectedAnnee: null,
    selectedRedListCategory: null,
    selectedStatutReglementaire: null,
    anneeDebut: null,
    anneeFin: null,
    activeFilters: [],
  },
  hoverState: {
    chartType: null,
    dataKey: null,
    value: null,
  },
  showStatsPanel: false,
  statsPanelCommune: null,
  
  // Actions
  setSelectedCommune: (insee) => set({ selectedCommune: insee }),
  
  setCommunes: (communes) => set({ communes }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setShow3D: (show) => set({ show3D: show }),
  
  setShowCommunes: (show) => set({ showCommunes: show }),
  
  setMapStyle: (style) => set({ mapStyle: style }),
  
  setCommuneData: (data) => set({ communeData: data }),
  
  setSpeciesData: (data) => set({ speciesData: data }),
  
  setFilter: (filterType, value, source) => set((state) => ({
    filters: {
      ...state.filters,
      [filterType]: value
    }
  })),
  
  removeFilter: (filterType) => set((state) => ({
    filters: {
      ...state.filters,
      [filterType]: null
    }
  })),
  
  clearFilters: () => set({
    filters: {
      selectedGroupe: null,
      selectedGroup2: null,
      selectedMois: null,
      selectedStatut: null,
      selectedRegne: null,
      selectedOrdre: null,
      selectedFamille: null,
      selectedAnnee: null,
      selectedRedListCategory: null,
      selectedStatutReglementaire: null,
      anneeDebut: null,
      anneeFin: null,
      activeFilters: [],
    }
  }),
  
  resetFiltersOnCommuneChange: () => set({
    filters: {
      selectedGroupe: null,
      selectedGroup2: null,
      selectedMois: null,
      selectedStatut: null,
      selectedRegne: null,
      selectedOrdre: null,
      selectedFamille: null,
      selectedAnnee: null,
      selectedRedListCategory: null,
      selectedStatutReglementaire: null,
      anneeDebut: null,
      anneeFin: null,
      activeFilters: [],
    }
  }),
  
  applyFilterEvent: (event) => {
    const { filterKey, value, source } = event
    set((state) => {
      // Si la valeur est la même que celle déjà active, désactiver le filtre (toggle)
      const currentValue = state.filters[filterKey]
      const newValue = currentValue === value ? null : value
      
      const newFilters = { ...state.filters, [filterKey]: newValue }
      
      // Mettre à jour la liste des filtres actifs
      const activeFilters = Object.entries(newFilters)
        .filter(([key, val]) => val !== null && key !== 'activeFilters')
        .map(([key]) => key)
      
      console.log(`🔄 Filtre appliqué par ${source}:`, { 
        filterKey, 
        oldValue: currentValue, 
        newValue, 
        valueType: typeof value,
        event,
        newFilters 
      })
      
      return {
        filters: {
          ...newFilters,
          activeFilters
        }
      }
    })
  },
  
  setHoverState: (state) => set({ hoverState: state }),
  
  clearHoverState: () => set({ hoverState: { chartType: null, dataKey: null, value: null } }),
  
  setShowStatsPanel: (showStatsPanel) => set({ showStatsPanel }),
  
  setStatsPanelCommune: (statsPanelCommune) => set({ statsPanelCommune }),
  
  resetMapView: () => set({ selectedCommune: null }),
}))

// Sélecteurs utiles
export const useSelectedCommuneData = () => {
  const { selectedCommune, communeData } = useAppStore()
  
  if (!selectedCommune || !communeData) return null
  
  return communeData.get(selectedCommune) || null
}

export const useFilteredSpeciesData = () => {
  const { speciesData, filters } = useAppStore()
  
  if (!speciesData) return null
  
  let filtered = Array.from(speciesData.values())
  
  if (filters.selectedGroupe) {
    filtered = filtered.filter(species => species.groupe === filters.selectedGroupe)
  }
  
  if (filters.selectedRedListCategory) {
    if (filters.selectedRedListCategory === 'Non évalué') {
      // Pour "Non évalué", inclure toutes les espèces qui n'ont PAS de statut de liste rouge
      filtered = filtered.filter(species => !species.listeRouge)
    } else {
      // Pour les autres statuts, filtrer par le statut spécifique
      filtered = filtered.filter(species => 
        species.listeRouge?.['Label Statut'] === filters.selectedRedListCategory
      )
    }
  }
  
  if (filters.selectedStatut) {
    filtered = filtered.filter(species => 
      species.listeRouge?.['Label Statut'] === filters.selectedStatut
    )
  }
  
  return filtered
} 