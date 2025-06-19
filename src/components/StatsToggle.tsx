import { useAppStore } from '../store/useAppStore'
import { X } from 'lucide-react'

interface StatsToggleProps {
  compactPadding?: boolean
  noBottomMargin?: boolean
}

export default function StatsToggle({ compactPadding = false, noBottomMargin = false }: StatsToggleProps) {
  const { visibleStats, toggleStatVisibility } = useAppStore()

  // Définir les statistiques avec leurs labels
  const statsConfig = [
    { key: 'groupes' as const, label: 'Groupes taxonomiques' },
    { key: 'phenologie' as const, label: 'Phénologie mensuelle' },
    { key: 'listesRouges' as const, label: 'Statuts listes rouges' },
    { key: 'statutsReglementaires' as const, label: 'Statuts réglementaires' },
    { key: 'evolutionGroupes' as const, label: 'Évolution des groupes' },
    { key: 'listeEspeces' as const, label: 'Liste des espèces' }
  ]

  // Séparer les statistiques actives et inactives
  const activeStats = statsConfig.filter(stat => visibleStats[stat.key])
  const inactiveStats = statsConfig.filter(stat => !visibleStats[stat.key])

  return (
    <div className={`modern-card z-filters shadow-xl fade-in-up ${noBottomMargin ? '' : 'mb-8'} ${compactPadding ? 'p-3' : ''}`}>
      {/* Première ligne : Titre et boutons alignés */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-h-[72px]">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">📊</span>
          <span className="text-xl font-bold text-gradient">Statistiques</span>
        </div>
        
        {/* Boutons des statistiques */}
        <div className="flex flex-wrap gap-2">
          {/* Statistiques inactives d'abord - style uniforme */}
          {inactiveStats.map((stat) => (
            <button
              key={stat.key}
              onClick={() => toggleStatVisibility(stat.key)}
              className="inline-flex items-center gap-1 backdrop-blur-sm border border-white/30 rounded-lg px-2 py-1 text-xs text-white transition-all hover:shadow-md hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(139, 69, 19, 0.6)', // Couleur uniforme marron
                opacity: 0.7 
              }}
            >
              <span className="font-medium">{stat.label}</span>
            </button>
          ))}
          
          {/* Statistiques actives ensuite - avec rampe de couleur et croix */}
          {activeStats.map((stat, index) => {
            // Calculer la couleur basée sur l'index pour variation
            const ratio = activeStats.length === 1 ? 0.5 : index / (activeStats.length - 1)
            const startColor = { r: 45, g: 80, b: 22 }       // #2d5016 (vert foncé)
            const endColor = { r: 205, g: 133, b: 63 }       // #cd853f (marron doré)
            
            const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio)
            const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio)
            const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio)
            const bgColor = `rgb(${r}, ${g}, ${b})`
            
            return (
              <div
                key={stat.key}
                className="inline-flex items-center gap-1 backdrop-blur-sm border border-white/30 rounded-lg px-2 py-1 text-xs text-white"
                style={{ backgroundColor: bgColor, opacity: 0.9 }}
              >
                <span className="font-medium">{stat.label}</span>
                <button
                  onClick={() => toggleStatVisibility(stat.key)}
                  className="ml-1 text-white/80 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 