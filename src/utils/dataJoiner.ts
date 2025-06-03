import type { 
  SyntheseInsee, 
  PhenoMoisInsee, 
  Taxonomie, 
  ListeRouge, 
  Statut,
  CommuneCollection 
} from '../types'

export interface CommuneData {
  insee: string
  nom?: string
  observations: SyntheseInsee[]
  phenologie: PhenoMoisInsee[]
  totalObs: number
  totalEsp: number
}

export interface SpeciesData {
  cdRef: string
  nomValide: string
  groupe: string
  ordre: string
  famille: string
  listeRouge?: ListeRouge
  statuts: Statut[]
  observations: SyntheseInsee[]
}

export function joinCommuneData(
  syntheseData: SyntheseInsee[],
  phenoData: PhenoMoisInsee[]
): Map<string, CommuneData> {
  const communeMap = new Map<string, CommuneData>()
  
  // Grouper les observations par INSEE pour calculer le nombre d'espèces
  const inseeSpeciesMap = new Map<string, Set<string>>()
  
  console.log('🔗 Début de la jointure des données...')
  console.log('🔗 Données synthèse:', syntheseData.length, 'lignes')
  console.log('🔗 Première ligne synthèse:', syntheseData[0])
  
  // Initialiser avec les données de synthèse
  syntheseData.forEach((obs, index) => {
    const insee = String(obs['Insee (Synthese!Insee)']) // Force la conversion en string
    const cdRef = obs['Cd Ref']
    
    if (index < 5) {
      console.log(`🔗 Ligne ${index}: INSEE=${insee} (type: ${typeof insee}), CdRef=${cdRef}`)
    }
    
    if (!communeMap.has(insee)) {
      communeMap.set(insee, {
        insee,
        observations: [],
        phenologie: [],
        totalObs: 0,
        totalEsp: 0
      })
    }
    
    if (!inseeSpeciesMap.has(insee)) {
      inseeSpeciesMap.set(insee, new Set())
    }
    
    const commune = communeMap.get(insee)!
    commune.observations.push(obs)
    commune.totalObs += obs['Nb Obs']
    inseeSpeciesMap.get(insee)!.add(cdRef)
  })
  
  // Calculer le nombre d'espèces par commune
  inseeSpeciesMap.forEach((species, insee) => {
    const commune = communeMap.get(insee)
    if (commune) {
      commune.totalEsp = species.size
    }
  })
  
  // Ajouter les données phénologiques
  phenoData.forEach(pheno => {
    const insee = String(pheno['Insee (Pheno!Mois!Insee)']) // Force la conversion en string
    const commune = communeMap.get(insee)
    
    if (commune) {
      commune.phenologie.push(pheno)
    }
  })
  
  console.log('🔗 Jointure terminée. Communes créées:', communeMap.size)
  console.log('🔗 Premiers codes INSEE:', Array.from(communeMap.keys()).slice(0, 10))
  
  return communeMap
}

// Fonction pour enrichir les données communales avec les noms des communes
export function enrichCommuneDataWithNames(
  communeData: Map<string, CommuneData>,
  communesGeoJSON: CommuneCollection
): Map<string, CommuneData> {
  console.log('🏘️ Enrichissement avec les noms des communes...')
  console.log('🏘️ Communes dans communeData:', communeData.size)
  console.log('🏘️ Communes dans GeoJSON:', communesGeoJSON.features.length)
  
  let matchCount = 0
  
  communesGeoJSON.features.forEach((feature, index) => {
    const insee = String(feature.properties.insee) // Force la conversion en string
    const nom = feature.properties.nom
    const commune = communeData.get(insee)
    
    if (index < 5) {
      console.log(`🏘️ GeoJSON ${index}: INSEE=${insee} (type: ${typeof insee}), nom=${nom}, trouvée=${!!commune}`)
    }
    
    if (commune) {
      commune.nom = nom
      matchCount++
    }
  })
  
  console.log(`🏘️ Enrichissement terminé. ${matchCount}/${communesGeoJSON.features.length} communes enrichies`)
  
  return communeData
}

export function joinSpeciesData(
  syntheseData: SyntheseInsee[],
  taxonomieData: Taxonomie[],
  listesRougesData: ListeRouge[],
  statutsData: Statut[]
): Map<string, SpeciesData> {
  const speciesMap = new Map<string, SpeciesData>()
  const taxonomieMap = new Map<string, Taxonomie>()
  const listesRougesMap = new Map<string, ListeRouge>()
  
  // Créer les maps de lookup
  taxonomieData.forEach(tax => {
    taxonomieMap.set(tax['Cd Nom'], tax)
  })
  
  listesRougesData.forEach(lr => {
    listesRougesMap.set(lr['CD NOM'], lr)
  })
  
  // Joindre les données
  syntheseData.forEach(obs => {
    const cdRef = obs['Cd Ref']
    const taxonomie = taxonomieMap.get(cdRef)
    
    if (taxonomie) {
      if (!speciesMap.has(cdRef)) {
        const statuts = statutsData.filter(s => s['CD NOM'] === cdRef)
        
        speciesMap.set(cdRef, {
          cdRef,
          nomValide: taxonomie['Nom Valide'],
          groupe: taxonomie['Group1 Inpn'],
          ordre: taxonomie['Ordre'],
          famille: taxonomie['Famille'],
          listeRouge: listesRougesMap.get(cdRef),
          statuts,
          observations: []
        })
      }
      
      const species = speciesMap.get(cdRef)!
      species.observations.push(obs)
    }
  })
  
  return speciesMap
}

export function getGroupeStats(speciesData: Map<string, SpeciesData>) {
  const groupeStats = new Map<string, { especes: number, observations: number }>()
  
  speciesData.forEach(species => {
    const groupe = species.groupe
    const totalObs = species.observations.reduce((sum, obs) => sum + obs['Nb Obs'], 0)
    
    if (!groupeStats.has(groupe)) {
      groupeStats.set(groupe, { especes: 0, observations: 0 })
    }
    
    const stats = groupeStats.get(groupe)!
    stats.especes += 1
    stats.observations += totalObs
  })
  
  return groupeStats
}

export function getMonthlyStats(communeData: Map<string, CommuneData>, insee?: string) {
  const monthlyStats = new Map<number, number>()
  
  // Initialiser tous les mois
  for (let i = 1; i <= 12; i++) {
    monthlyStats.set(i, 0)
  }
  
  const sourceData = insee 
    ? [communeData.get(insee)].filter(Boolean) 
    : Array.from(communeData.values())
  
  sourceData.forEach(commune => {
    commune?.phenologie.forEach(pheno => {
      const current = monthlyStats.get(pheno['Mois Obs']) || 0
      monthlyStats.set(pheno['Mois Obs'], current + pheno['Nb Donnees'])
    })
  })
  
  return monthlyStats
} 