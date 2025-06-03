import { Metadata } from 'next'
import CommunePageClient from './CommunePageClient'
import { loadCommunesGeoJSON } from '../../../utils/geojsonLoader'

interface PageProps {
  params: {
    code_insee: string
  }
}

// Générer les métadonnées dynamiques
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const communesGeoJSON = await loadCommunesGeoJSON()
    const commune = communesGeoJSON.features.find(f => f.properties.insee === params.code_insee)
    const communeName = commune?.properties.nom || `Commune ${params.code_insee}`
    
    return {
      title: `${communeName} - Fiche CCPM`,
      description: `Données naturalistes de la commune de ${communeName} dans le territoire CCPM`
    }
  } catch (error) {
    return {
      title: `Commune ${params.code_insee} - Fiche CCPM`,
      description: 'Données naturalistes de la commune dans le territoire CCPM'
    }
  }
}

// Générer les paramètres statiques pour toutes les communes
export async function generateStaticParams() {
  try {
    console.log('🔄 Génération des paramètres statiques pour les communes...')
    const communesGeoJSON = await loadCommunesGeoJSON()
    
    console.log(`GeoJSON chargé (serveur): ${communesGeoJSON.features.length} communes`)
    
    const params = communesGeoJSON.features.map((feature) => ({
      code_insee: feature.properties.insee,
    }))
    
    console.log(`✅ generateStaticParams - ${params.length} codes INSEE générés`)
    console.log('📋 Codes INSEE:', params.map(p => p.code_insee))
    
    return params
  } catch (error) {
    console.error('❌ Erreur lors du chargement des communes pour generateStaticParams:', error)
    return []
  }
}

export default function CommunePage({ params }: PageProps) {
  return <CommunePageClient codeInsee={params.code_insee} />
} 