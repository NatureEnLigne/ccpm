import GroupBubble from '../dashboards/GroupBubble'
import PhenoLine from '../dashboards/PhenoLine'
import RedListBar from '../dashboards/RedListBar'
import StatusTreemap from '../dashboards/StatusTreemap'
import GroupsEvolutionStream from '../dashboards/GroupsEvolutionStream'
import ObservationsAnnuellesBar from '../dashboards/ObservationsAnnuellesBar'
import { useAppStore } from '../../store/useAppStore'

interface CommuneDashboardsProps {
  codeInsee: string
}

export default function CommuneDashboards({ codeInsee }: CommuneDashboardsProps) {
  const { visibleStats } = useAppStore()

  // Calculer le nombre de graphiques (non-liste et non-observations annuelles) visibles
  const chartStatsCount = [
    visibleStats.groupes,
    visibleStats.phenologie, 
    visibleStats.listesRouges,
    visibleStats.statutsReglementaires,
    visibleStats.evolutionGroupes
  ].filter(Boolean).length

  // Définir les tailles de chaque statistique
  const getStatSize = (statKey: string): string => {
    switch (statKey) {
      case 'groupes':
        return 'w-full lg:w-1/2' // 1/2 largeur sur grand écran
      case 'phenologie':
        return 'w-full lg:w-1/2' // 1/2 largeur sur grand écran
      case 'listesRouges':
        return 'w-full lg:w-1/2' // 1/2 largeur sur grand écran
      case 'statutsReglementaires':
        return 'w-full lg:w-1/2' // 1/2 largeur sur grand écran
      case 'evolutionGroupes':
        return 'w-full' // Largeur complète
      default:
        return 'w-full lg:w-1/2'
    }
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Graphiques avec tailles individuelles */}
      {chartStatsCount > 0 && (
        <div className="flex flex-wrap gap-6 overflow-hover-safe w-full">
          
          {/* Groupes taxonomiques - Bubble chart */}
          {visibleStats.groupes && (
            <div className={`${getStatSize('groupes')} container-hover-safe`}>
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
            <div className={`${getStatSize('phenologie')} container-hover-safe`}>
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
            <div className={`${getStatSize('listesRouges')} container-hover-safe`}>
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
            <div className={`${getStatSize('statutsReglementaires')} container-hover-safe`}>
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

          {/* Évolution des groupes - Stream chart */}
          {visibleStats.evolutionGroupes && (
            <div className={`${getStatSize('evolutionGroupes')} container-hover-safe`}>
              <div className="modern-card z-middle shadow-xl fade-in-up">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">🌊</span>
                  <span className="text-gradient">Évolution des groupes</span>
                </h3>
                <div className="h-64 sm:h-80 flex-1">
                  <GroupsEvolutionStream codeInsee={codeInsee} />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Observations annuelles - Bar chart - 100% largeur */}
      {visibleStats.observationsAnnuelles && (
        <div className="w-full">
          <div className="container-hover-safe">
            <div className="modern-card z-middle shadow-xl fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                <span className="text-gradient">Observations par année</span>
              </h3>
              <div className="h-64 sm:h-80 flex-1">
                <ObservationsAnnuellesBar codeInsee={codeInsee} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
} 