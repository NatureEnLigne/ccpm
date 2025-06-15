import { Suspense } from 'react'
import ComparisonPageClient from './ComparisonPageClient'

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