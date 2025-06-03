'use client'

import { useAppStore } from '../store/useAppStore'
import { formatNumber } from '../utils/formatters'

export default function StatsPanel() {
  const {
    showStatsPanel,
    statsPanelCommune,
    communeData,
    setShowStatsPanel,
    setStatsPanelCommune,
    setSelectedCommune
  } = useAppStore()

  const closeStatsPanel = () => {
    setShowStatsPanel(false)
    setStatsPanelCommune(null)
  }

  const statsCommuneData = statsPanelCommune && communeData 
    ? communeData.get(statsPanelCommune) 
    : null

  // Debug des données
  console.log('📊 Debug StatsPanel:', {
    showStatsPanel,
    statsPanelCommune,
    communeData: communeData ? `Map avec ${communeData.size} communes` : 'null',
    statsCommuneData: statsCommuneData ? 'Données trouvées' : 'Aucune donnée'
  })

  if (!showStatsPanel) return null

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm rounded-2xl">
      <div className="h-full w-full p-6 flex items-center justify-center">
        <div className="glass rounded-2xl p-6 w-full max-w-4xl max-h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              {statsCommuneData?.nom || `INSEE ${statsPanelCommune}`}
            </h3>
            <button
              onClick={closeStatsPanel}
              className="p-3 hover:bg-white/20 rounded-xl transition-colors text-2xl"
              title="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Contenu */}
          {statsCommuneData ? (
            <div className="flex-1 overflow-auto space-y-6">
              {/* Informations générales */}
              <div className="bg-white/20 rounded-xl p-6">
                <h4 className="text-xl font-bold text-gray-800 mb-4">
                  Données naturalistes
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatNumber(statsCommuneData.totalObs)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Observations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {formatNumber(statsCommuneData.totalEsp)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Espèces</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
                  <div>
                    <span className="text-gray-600 text-sm">Code INSEE:</span>
                    <p className="font-semibold">{statsCommuneData.insee}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Entrées de données:</span>
                    <p className="font-semibold">{statsCommuneData.observations.length}</p>
                  </div>
                </div>
              </div>

              {/* Phénologie */}
              {statsCommuneData.phenologie.length > 0 && (
                <div className="bg-white/20 rounded-xl p-6">
                  <h5 className="text-lg font-bold text-gray-800 mb-4">
                    📅 Répartition mensuelle des observations
                  </h5>
                  <div className="grid grid-cols-4 gap-3">
                    {statsCommuneData.phenologie
                      .sort((a, b) => a['Mois Obs'] - b['Mois Obs'])
                      .map((pheno, index) => {
                        const moisNoms = [
                          'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                          'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
                        ]
                        return (
                          <div key={index} className="bg-white/20 rounded-lg p-3 text-center">
                            <div className="text-sm font-medium text-gray-700">
                              {moisNoms[pheno['Mois Obs'] - 1]}
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {formatNumber(pheno['Nb Donnees'])}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSelectedCommune(statsPanelCommune!)
                    closeStatsPanel()
                  }}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 font-semibold py-3 px-6 rounded-xl transition-colors border border-blue-300/50"
                >
                  🎯 Centrer sur cette commune
                </button>
                <button
                  onClick={closeStatsPanel}
                  className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors border border-gray-300/50"
                >
                  ✕ Fermer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-xl text-gray-600 mb-4">Aucune donnée disponible</p>
                <div className="text-sm text-gray-500">
                  <p>Debug info:</p>
                  <p>statsPanelCommune: {statsPanelCommune || 'null'}</p>
                  <p>communeData: {communeData ? `${communeData.size} communes` : 'null'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 