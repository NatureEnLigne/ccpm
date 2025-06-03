import { create } from 'zustand'
import type { CommuneCollection, FilterState } from '../types'
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
  
  // Filtres
  filters: FilterState
  
  // Actions
  setSelectedCommune: (insee: string | null) => void
  setCommunes: (communes: CommuneCollection) => void
  setLoading: (loading: boolean) => void
  setShow3D: (show: boolean) => void
  setMapStyle: (style: string) => void
  setCommuneData: (data: Map<string, CommuneData>) => void
  setSpeciesData: (data: Map<string, SpeciesData>) => void
  setFilter: (filterType: keyof FilterState, value: string | number | null) => void
  clearFilters: () => void
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
  },
  
  // Actions
  setSelectedCommune: (insee) => set({ selectedCommune: insee }),
  
  setCommunes: (communes) => set({ communes }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setShow3D: (show) => set({ show3D: show }),
  
  setMapStyle: (style) => set({ mapStyle: style }),
  
  setCommuneData: (data) => set({ communeData: data }),
  
  setSpeciesData: (data) => set({ speciesData: data }),
  
  setFilter: (filterType, value) => set((state) => ({
    filters: {
      ...state.filters,
      [filterType]: value
    }
  })),
  
  clearFilters: () => set({
    filters: {
      selectedGroupe: null,
      selectedMois: null,
      selectedStatut: null,
    }
  }),
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
      species.listeRouge?.Statut === filters.selectedStatut
    )
  }
  
  return filtered
} 