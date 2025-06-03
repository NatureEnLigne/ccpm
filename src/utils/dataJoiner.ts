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
  nomComplet: string
  nomVern: string
  groupe: string
  group2: string
  regne: string
  ordre: string
  famille: string
  urlInpn: string
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
  
  console.log('🔗 Début jointure espèces...')
  console.log('🔗 Taxonomie:', taxonomieData.length, 'lignes')
  console.log('🔗 Listes rouges:', listesRougesData.length, 'lignes')
  console.log('🔗 Statuts:', statutsData.length, 'lignes')
  
  // Créer les maps de lookup avec les bonnes clés
  taxonomieData.forEach((tax, index) => {
    const cdRef = tax['CD REF (taxonomie)'] // Utiliser CD REF au lieu de Cd Nom
    if (index < 3) {
      console.log(`🔗 Taxonomie ${index}: CD REF=${cdRef}, Nom=${tax['Nom Valide']}`)
    }
    taxonomieMap.set(cdRef, tax)
  })
  
  listesRougesData.forEach((lr, index) => {
    const cdNom = lr['CD NOM (lists!rouges)'] // Utiliser la bonne clé
    if (index < 3) {
      console.log(`🔗 Liste rouge ${index}: CD NOM=${cdNom}, Statut=${lr['Label Statut']}`)
    }
    listesRougesMap.set(cdNom, lr)
  })
  
  console.log('🔗 Maps créées - Taxonomie:', taxonomieMap.size, 'Listes rouges:', listesRougesMap.size)
  
  // Joindre les données
  syntheseData.forEach(obs => {
    const cdRef = obs['Cd Ref']
    const taxonomie = taxonomieMap.get(cdRef)
    
    if (taxonomie) {
      if (!speciesMap.has(cdRef)) {
        // Utiliser CD REF pour filtrer les statuts aussi
        const statuts = statutsData.filter(s => s['CD NOM (statuts)'] === cdRef)
        // Récupérer la liste rouge avec CD REF (car taxonomie contient le CD NOM correspondant)
        const cdNom = taxonomie['Cd Nom']
        const listeRouge = listesRougesMap.get(cdNom)
        
        speciesMap.set(cdRef, {
          cdRef,
          nomValide: taxonomie['Nom Valide'],
          nomComplet: taxonomie['Nom Complet'],
          nomVern: taxonomie['Nom Vern'],
          groupe: taxonomie['Group1 Inpn'],
          group2: taxonomie['Group2 Inpn'],
          regne: taxonomie['Regne'],
          ordre: taxonomie['Ordre'],
          famille: taxonomie['Famille'],
          urlInpn: taxonomie['Url Inpn'],
          listeRouge,
          statuts,
          observations: []
        })
      }
      
      const species = speciesMap.get(cdRef)!
      species.observations.push(obs)
    }
  })
  
  console.log('🔗 Jointure espèces terminée. Espèces créées:', speciesMap.size)
  const speciesWithLR = Array.from(speciesMap.values()).filter(s => s.listeRouge).length
  const speciesWithStatuts = Array.from(speciesMap.values()).filter(s => s.statuts.length > 0).length
  console.log('🔗 Espèces avec liste rouge:', speciesWithLR, 'avec statuts:', speciesWithStatuts)
  
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