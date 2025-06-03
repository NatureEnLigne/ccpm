import { create } from 'zustand'
import type { CommuneCollection, FilterState, HoverState, FilterEvent } from '../types'
import type { CommuneData, SpeciesData } from '../utils/dataJoiner'

interface AppState {
  // État de la carte
  selectedCommune: string | null
  communes: CommuneCollection | null
  isLoading: boolean
  show3D: boolean
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
  setMapStyle: (style: string) => void
  setCommuneData: (data: Map<string, CommuneData>) => void
  setSpeciesData: (data: Map<string, SpeciesData>) => void
  
  // Actions de filtres étendues
  setFilter: (filterType: keyof FilterState, value: string | number | null, source?: string) => void
  removeFilter: (filterType: keyof FilterState) => void
  clearFilters: () => void
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
  mapStyle: 'satellite-v9',
  communeData: null,
  speciesData: null,
  filters: {
    selectedGroupe: null,
    selectedMois: null,
    selectedStatut: null,
    selectedRegne: null,
    selectedOrdre: null,
    selectedFamille: null,
    selectedAnnee: null,
    selectedRedListCategory: null,
    selectedStatutReglementaire: null,
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
      selectedMois: null,
      selectedStatut: null,
      selectedRegne: null,
      selectedOrdre: null,
      selectedFamille: null,
      selectedAnnee: null,
      selectedRedListCategory: null,
      selectedStatutReglementaire: null,
      activeFilters: [],
    }
  }),
  
  applyFilterEvent: (event) => {
    const { filterKey, value, source } = event
    set((state) => {
      const newFilters = { ...state.filters, [filterKey]: value }
      
      // Mettre à jour la liste des filtres actifs
      const activeFilters = Object.entries(newFilters)
        .filter(([key, val]) => val !== null && key !== 'activeFilters')
        .map(([key]) => key)
      
      return {
        filters: {
          ...newFilters,
          activeFilters
        }
      }
    })
    
    console.log(`🔄 Filtre appliqué par ${source}:`, event)
  },
  
  setHoverState: (state) => set({ hoverState: state }),
  
  clearHoverState: () => set({ hoverState: { chartType: null, dataKey: null, value: null } }),
  
  setShowStatsPanel: (showStatsPanel) => set({ showStatsPanel }),
  
  setStatsPanelCommune: (statsPanelCommune) => set({ statsPanelCommune }),
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
  
  if (filters.selectedStatut) {
    filtered = filtered.filter(species => 
      species.listeRouge?.['Label Statut'] === filters.selectedStatut
    )
  }
  
  return filtered
} 