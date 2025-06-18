'use client'

import dynamic from 'next/dynamic'
import { useAppStore } from '../store/useAppStore'

// Import dynamique de Leaflet pour éviter les erreurs SSR
const DynamicMapComponent = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-amber-600 mx-auto mb-6"></div>
        <p className="data-label-unified font-bold text-lg">Chargement de la carte...</p>
      </div>
    </div>
  )
})

export default function Map() {
  const { isLoading } = useAppStore()

  return (
    <div className="relative w-full h-full">
      <DynamicMapComponent />
      
      {/* Loading overlay global */}
      {isLoading && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-50" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-amber-600 mx-auto mb-6"></div>
            <p className="data-label-unified font-bold text-lg">Chargement des données...</p>
          </div>
        </div>
      )}
    </div>
  )
} 