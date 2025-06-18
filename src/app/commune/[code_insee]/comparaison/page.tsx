import { Suspense } from 'react'
import ComparisonPageClient from './ComparisonPageClient'
import { loadCommunesGeoJSON } from '../../../../utils/geojsonLoader'

// Génération statique des paramètres pour toutes les communes
export async function generateStaticParams() {
  try {
    console.log('🔄 Génération des paramètres statiques pour les pages de comparaison...')
    
    // Charger les données des communes
    const communesGeoJSON = await loadCommunesGeoJSON()
    console.log(`GeoJSON chargé (serveur): ${communesGeoJSON.features.length} communes`)
    
    // Générer les paramètres pour chaque commune
    const params = communesGeoJSON.features.map((commune) => ({
      code_insee: commune.properties.insee
    }))
    
    console.log(`✅ generateStaticParams comparaison - ${params.length} codes INSEE générés`)
    console.log('📋 Codes INSEE:', params.map(p => p.code_insee))
    
    return params
  } catch (error) {
    console.error('❌ Erreur lors de la génération des paramètres statiques pour comparaison:', error)
    return []
  }
}

interface ComparisonPageProps {
  params: {
    code_insee: string
  }
}

export default function ComparisonPage({ params }: ComparisonPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement de la comparaison...</h2>
        </div>
      </div>
    }>
      <ComparisonPageClient codeInseeBase={params.code_insee} />
    </Suspense>
  )
} 