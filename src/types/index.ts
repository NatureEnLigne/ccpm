// Types pour les données GeoJSON
export interface CommuneProperties {
  insee: string
  nom: string
  wikipedia?: string
  surf_ha?: number
}

export interface CommuneFeature {
  type: 'Feature'
  properties: CommuneProperties
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

export interface CommuneCollection {
  type: 'FeatureCollection'
  features: CommuneFeature[]
}

// Types pour les données CSV - Noms réels des colonnes
export interface SyntheseInsee {
  'Insee (Synthese!Insee)': string
  'An Obs': number
  'Cd Ref': string
  'Nb Obs': number
}

export interface PhenoMoisInsee {
  'Insee (Pheno!Mois!Insee)': string
  'Mois Obs': number
  'CD REF (pheno!mois!insee)': string
  'Nb Donnees': number
}

export interface Taxonomie {
  'Cd Nom': string
  'CD REF (taxonomie)': string
  'Nom Valide': string
  'Group1 Inpn': string
  'Group2 Inpn': string
  'Group3 Inpn': string
  'Ordre': string
  'Famille': string
  'Classe': string
  'Phylum': string
  'Regne': string
  'Nom Complet': string
  'Nom Vern': string
  'Url Inpn': string
  'Rang': string
  'Sous Famille': string
  'Tribu': string
  'URL': string
  'Gbif Id': string
  'Afficher Niveau': string
  'Afficher Niveau good': string
  'Habitat': string
}

export interface ListeRouge {
  'CD NOM (lists!rouges)': string
  'Code Statut': string
  'Label Statut': string
  'Lb Adm Tr': string
  'Lb Type Statut': string
}

export interface Statut {
  'CD NOM (statuts)': string
  'CD TYPE STATUT (statuts)': string
  'CODE STATUT (statuts)': string
  'LABEL STATUT (statuts)': string
  'LB TYPE STATUT (statuts)': string
}

// Types pour l'état de l'application
export interface MapState {
  selectedCommune: string | null
  communes: CommuneCollection | null
  isLoading: boolean
  show3D: boolean
  mapStyle: string
}

export interface FilterState {
  selectedGroupe: string | null
  selectedMois: number | null
  selectedStatut: string | null
  selectedRegne: string | null
  selectedOrdre: string | null
  selectedFamille: string | null
  selectedAnnee: number | null
  selectedRedListCategory: string | null
  activeFilters: string[] // Liste des filtres actifs pour l'affichage
}

// Types pour les graphiques
export interface BubbleData {
  id: string
  value: number
  group?: string
  color?: string
}

export interface LineData {
  id: string
  data: Array<{
    x: number | string
    y: number
  }>
}

export interface BarData {
  id: string
  label: string
  value: number
  color?: string
}

export interface TreemapData {
  id: string
  label: string
  value: number
  children?: TreemapData[]
}

// Types pour les interactions croisées
export interface ChartInteraction {
  chartType: 'bubble' | 'line' | 'bar' | 'treemap'
  dataKey: string
  value: string | number
  action: 'click' | 'hover' | 'filter'
}

export interface FilterEvent {
  filterKey: keyof FilterState
  value: string | number | null
  source: string // Quel composant a déclenché le filtre
}

export interface HoverState {
  chartType: string | null
  dataKey: string | null
  value: string | number | null
} 