import GroupBubble from '../dashboards/GroupBubble'
import PhenoLine from '../dashboards/PhenoLine'
import RedListBar from '../dashboards/RedListBar'
import StatusTreemap from '../dashboards/StatusTreemap'

interface CommuneDashboardsProps {
  codeInsee: string
}

export default function CommuneDashboards({ codeInsee }: CommuneDashboardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 overflow-hover-safe w-full">
      
      {/* Groupes taxonomiques - Bubble chart */}
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

      {/* Phénologie mensuelle - Line chart */}
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

      {/* Listes rouges - Bar chart */}
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

      {/* Statuts réglementaires - Treemap */}
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

    </div>
  )
} 