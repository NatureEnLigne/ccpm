import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateSpeciesCSV } from '../../utils/csvExport'
import { generateShareLink } from '../../utils/urlUtils'

interface CommuneActionsProps {
  codeInsee: string
  speciesData: any
  currentCommune: any
  filters: any
  filteredStats: { totalObs: number; totalEsp: number }
  linkCopied: boolean
  setLinkCopied: (copied: boolean) => void
}

// Fonction pour formater les nombres sans abréviation (3300 au lieu de 3.3k)
function formatNumberFull(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num)
}

export default function CommuneActions({
  codeInsee,
  speciesData,
  currentCommune,
  filters,
  filteredStats,
  linkCopied,
  setLinkCopied
}: CommuneActionsProps) {
  const router = useRouter()

  const handleShareLink = async () => {
    try {
      const shareLink = generateShareLink(codeInsee, filters)
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      
      // Réinitialiser l'état après 3 secondes
      setTimeout(() => {
        setLinkCopied(false)
      }, 3000)
    } catch (err) {
      console.error('Erreur lors de la copie du lien:', err)
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const shareLink = generateShareLink(codeInsee, filters)
      prompt('Copiez ce lien:', shareLink)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row xl:flex-row gap-4 justify-center xl:justify-end">
      {/* Cadre statistiques regroupées */}
      <div className="modern-card shadow-xl lg:flex-1 xl:flex-none">
        <div className="flex divide-x divide-white/20">
          {/* Observations */}
          <div className="p-3 text-center flex-1 min-w-[120px]">
            <div className="text-xl font-bold text-gradient mb-1">
              {formatNumberFull(filteredStats.totalObs)}
            </div>
            <div className="data-label-unified">
              Observations
            </div>
          </div>
          
          {/* Espèces */}
          <div className="p-3 text-center flex-1 min-w-[120px]">
            <div className="text-xl font-bold text-gradient mb-1">
              {formatNumberFull(filteredStats.totalEsp)}
            </div>
            <div className="data-label-unified">
              Espèces
            </div>
          </div>
        </div>
      </div>
      
      {/* Cadre actions - responsive selon écran */}
      <div className="modern-card shadow-xl lg:flex-1 xl:flex-none">
        <div className="flex flex-row divide-x divide-white/20">
          {/* Téléchargement CSV */}
          <button 
            onClick={() => generateSpeciesCSV(codeInsee, speciesData, currentCommune, filters)}
            className="p-2 sm:p-3 text-center flex-1 min-w-[70px] sm:min-w-[80px] lg:min-w-[100px] hover:bg-white/10 transition-colors rounded-l-lg"
            title="Télécharger la liste des espèces en CSV"
          >
            <div className="text-sm lg:text-lg font-bold mb-1 flex justify-center">
              <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gradient-to-br from-amber-600 to-green-800 rounded flex items-center justify-center">
                <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="data-label-unified text-xs lg:text-sm leading-tight">
              Télécharger
            </div>
          </button>
          
          {/* Comparaison */}
          <button 
            onClick={() => router.push(`/commune/${codeInsee}/comparaison`)}
            className="p-2 sm:p-3 text-center flex-1 min-w-[70px] sm:min-w-[80px] lg:min-w-[100px] hover:bg-white/10 transition-colors"
            title="Comparer avec une autre commune"
          >
            <div className="text-sm lg:text-lg font-bold mb-1 flex justify-center">
              <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gradient-to-br from-amber-600 to-green-800 rounded flex items-center justify-center">
                <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM11 4a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="data-label-unified text-xs lg:text-sm leading-tight">
              Comparer
            </div>
          </button>
          
          {/* Partage de lien */}
          <button 
            onClick={handleShareLink}
            className="p-2 sm:p-3 text-center flex-1 min-w-[70px] sm:min-w-[80px] lg:min-w-[100px] hover:bg-white/10 transition-colors rounded-r-lg"
            title="Partager le lien avec les filtres actuels"
          >
            <div className="text-sm lg:text-lg font-bold mb-1 flex justify-center">
              <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gradient-to-br from-amber-600 to-green-800 rounded flex items-center justify-center">
                {linkCopied ? (
                  <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                )}
              </div>
            </div>
            <div className="data-label-unified text-xs lg:text-sm leading-tight">
              {linkCopied ? 'Copié !' : 'Partager'}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
} 