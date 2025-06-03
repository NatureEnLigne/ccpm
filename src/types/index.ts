// Types pour les données GeoJSON
export interface CommuneProperties {
  Insee: string
  Nom: string
  Superficie?: number
  Population?: number
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

// Types pour les données CSV
export interface SyntheseInsee {
  Insee: string
  'Nb Obs': number
  'Nb Esp': number
  'Cd Ref': string
  Nom?: string
}

export interface PhenoMoisInsee {
  'CD REF': string
  Insee: string
  Mois: number
  'Nb Obs': number
}

export interface Taxonomie {
  'Cd Nom': string
  'Nom Valide': string
  'Groupe': string
  'Ordre': string
  'Famille': string
}

export interface ListeRouge {
  'CD NOM': string
  'Statut': string
  'Critere': string
}

export interface Statut {
  'CD NOM': string
  'Type Statut': string
  'Statut': string
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