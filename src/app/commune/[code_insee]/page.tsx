import { Suspense } from 'react'
import CommunePageClient from './CommunePageClient'
import { loadCommunesGeoJSON } from '../../../utils/geojsonLoader'

// Fonction requise pour les pages dynamiques avec output: export
export async function generateStaticParams() {
  try {
    // Charger toutes les communes depuis le GeoJSON
    const communesGeoJSON = await loadCommunesGeoJSON()
    
    // Extraire tous les codes INSEE disponibles
    const codeInseeList = communesGeoJSON.features.map(feature => ({
      code_insee: feature.properties.insee
    }))
    
    console.log('📍 generateStaticParams - Codes INSEE générés:', codeInseeList.length)
    
    return codeInseeList
  } catch (error) {
    console.error('❌ Erreur lors du chargement des communes pour generateStaticParams:', error)
    
    // En cas d'erreur, retourner une liste de secours avec les communes principales
    return [
      { code_insee: '80001' },
      { code_insee: '80006' },
      { code_insee: '80009' },
      { code_insee: '80025' },
      { code_insee: '80030' }, // Ajouter ARRY
      { code_insee: '80179' },
      { code_insee: '80212' },
      { code_insee: '80253' },
      { code_insee: '80318' },
      { code_insee: '80370' },
      { code_insee: '80410' },
      { code_insee: '80450' },
      { code_insee: '80520' },
      { code_insee: '80561' },
      { code_insee: '80570' },
      { code_insee: '80620' },
      { code_insee: '80806' }
    ]
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