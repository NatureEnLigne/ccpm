import GroupBubble from '../dashboards/GroupBubble'
import PhenoLine from '../dashboards/PhenoLine'
import RedListBar from '../dashboards/RedListBar'
import StatusTreemap from '../dashboards/StatusTreemap'
import AreaBumpChart from '../dashboards/AreaBump'
import { useAppStore } from '../../store/useAppStore'

interface CommuneDashboardsProps {
  codeInsee: string
}

export default function CommuneDashboards({ codeInsee }: CommuneDashboardsProps) {
  const { visibleStats } = useAppStore()

  // Calculer le nombre de statistiques visibles
  const visibleStatsCount = Object.values(visibleStats).filter(Boolean).length
  
  // Vérifier si la liste des espèces est visible
  const hasListeEspeces = visibleStats.listeEspeces
  
  // Calculer le nombre de graphiques (non-liste) visibles
  const chartStatsCount = [
    visibleStats.groupes,
    visibleStats.phenologie, 
    visibleStats.listesRouges,
    visibleStats.statutsReglementaires,
    visibleStats.evolutionEspeces
  ].filter(Boolean).length

  // Déterminer les classes de grille selon le nombre d'éléments visibles
  const getGridClasses = () => {
    if (visibleStatsCount === 0) return 'hidden'
    if (visibleStatsCount === 1) return 'grid grid-cols-1'
    
    // Si on a des graphiques + la liste des espèces
    if (hasListeEspeces && chartStatsCount > 0) {
      // Les graphiques prennent 1/2 de largeur chacun, la liste prend toute la largeur
      return 'grid grid-cols-1 lg:grid-cols-2'
    }
    
    // Sinon, logique normale pour les graphiques seuls
    if (visibleStatsCount === 2) return 'grid grid-cols-1 lg:grid-cols-2'
    if (visibleStatsCount === 3) return 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
    return 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2'
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Graphiques en grille */}
      {chartStatsCount > 0 && (
        <div className={`${getGridClasses()} gap-6 overflow-hover-safe w-full`}>
          
          {/* Groupes taxonomiques - Bubble chart */}
          {visibleStats.groupes && (
            <div className="container-hover-safe">
              <div className="modern-card z-middle shadow-xl fade-in-up">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">🦋</span>
                  <span className="text-gradient">Groupes taxonomiques</span>
                </h3>
                <div className="h-64 sm:h-80 flex-1">
                  <GroupBubble codeInsee={codeInsee} />
                </div>
              </div>
            </div>
          )}

          {/* Phénologie mensuelle - Line chart */}
          {visibleStats.phenologie && (
            <div className="container-hover-safe">
              <div className="modern-card z-middle shadow-xl fade-in-up">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <span className="text-gradient">Phénologie mensuelle</span>
                </h3>
                <div className="h-64 sm:h-80 flex-1">
                  <PhenoLine codeInsee={codeInsee} />
                </div>
              </div>
            </div>
          )}

          {/* Listes rouges - Bar chart */}
          {visibleStats.listesRouges && (
            <div className="container-hover-safe">
              <div className="modern-card z-middle shadow-xl fade-in-up">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">🚨</span>
                  <span className="text-gradient">Statuts listes rouges</span>
                </h3>
                <div className="h-64 sm:h-80 flex-1">
                  <RedListBar codeInsee={codeInsee} />
                </div>
              </div>
            </div>
          )}

          {/* Statuts réglementaires - Treemap */}
          {visibleStats.statutsReglementaires && (
            <div className="container-hover-safe">
              <div className="modern-card z-middle shadow-xl fade-in-up">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">⚖️</span>
                  <span className="text-gradient">Statuts réglementaires</span>
                </h3>
                <div className="h-64 sm:h-80 flex-1">
                  <StatusTreemap codeInsee={codeInsee} />
                </div>
              </div>
            </div>
          )}

          {/* Évolution des espèces - AreaBump */}
          {visibleStats.evolutionEspeces && (
            <div className="container-hover-safe">
              <div className="modern-card z-middle shadow-xl fade-in-up">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  <span className="text-gradient">Évolution des espèces</span>
                </h3>
                <div className="h-64 sm:h-80 flex-1">
                  <AreaBumpChart codeInsee={codeInsee} />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
} 