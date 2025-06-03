import { Suspense } from 'react'
import CommunePageClient from './CommunePageClient'
import { loadCommunesGeoJSON } from '../../../utils/geojsonLoader'

// Fonction requise pour les pages dynamiques avec output: export
export async function generateStaticParams() {
  try {
    console.log('🔄 Génération des paramètres statiques pour les communes...')
    
    // Charger toutes les communes depuis le GeoJSON
    const communesGeoJSON = await loadCommunesGeoJSON()
    
    // Extraire tous les codes INSEE disponibles
    const codeInseeList = communesGeoJSON.features.map(feature => {
      const insee = feature.properties.insee
      if (!insee) {
        console.warn('⚠️ Commune sans code INSEE trouvée:', feature.properties)
      }
      return {
        code_insee: insee
      }
    }).filter(item => item.code_insee) // Filtrer les valeurs nulles/undefined
    
    console.log(`✅ generateStaticParams - ${codeInseeList.length} codes INSEE générés`)
    console.log('📋 Codes INSEE:', codeInseeList.map(item => item.code_insee).sort())
    
    return codeInseeList
  } catch (error) {
    console.error('❌ Erreur lors du chargement des communes pour generateStaticParams:', error)
    
    // En cas d'erreur, retourner une liste vide plutôt qu'une liste de secours
    // Cela permettra à Next.js de générer les pages à la demande
    return []
  }
}

interface CommunePageProps {
  params: {
    code_insee: string
  }
}

export default function CommunePage({ params }: CommunePageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement des données...</h2>
          <p className="text-gray-600">Commune {params.code_insee}</p>
        </div>
      </div>
    }>
      <CommunePageClient codeInsee={params.code_insee} />
    </Suspense>
  )
} 