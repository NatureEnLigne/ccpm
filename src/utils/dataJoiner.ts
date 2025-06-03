import type { 
  SyntheseInsee, 
  PhenoMoisInsee, 
  Taxonomie, 
  ListeRouge, 
  Statut 
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
  
  // Initialiser avec les données de synthèse
  syntheseData.forEach(obs => {
    const insee = obs.Insee
    
    if (!communeMap.has(insee)) {
      communeMap.set(insee, {
        insee,
        nom: obs.Nom,
        observations: [],
        phenologie: [],
        totalObs: 0,
        totalEsp: 0
      })
    }
    
    const commune = communeMap.get(insee)!
    commune.observations.push(obs)
    commune.totalObs += obs['Nb Obs']
    commune.totalEsp += obs['Nb Esp']
  })
  
  // Ajouter les données phénologiques
  phenoData.forEach(pheno => {
    const insee = pheno.Insee
    const commune = communeMap.get(insee)
    
    if (commune) {
      commune.phenologie.push(pheno)
    }
  })
  
  return communeMap
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
          groupe: taxonomie.Groupe,
          ordre: taxonomie.Ordre,
          famille: taxonomie.Famille,
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
      const current = monthlyStats.get(pheno.Mois) || 0
      monthlyStats.set(pheno.Mois, current + pheno['Nb Obs'])
    })
  })
  
  return monthlyStats
} 