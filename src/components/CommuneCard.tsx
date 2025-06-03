'use client'

import { useState } from 'react'
import { ExternalLink, MapPin, Eye, BarChart3 } from 'lucide-react'
import { formatNumber } from '../utils/formatters'
import type { CommuneData } from '../utils/dataJoiner'

interface CommuneCardProps {
  communeData: CommuneData
  onViewDetails: () => void
  onClose?: () => void
  className?: string
}

export default function CommuneCard({ 
  communeData, 
  onViewDetails, 
  onClose,
  className = '' 
}: CommuneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={`glass-card rounded-2xl p-6 animate-scale-in ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <MapPin className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">
              {communeData.nom || `INSEE ${communeData.insee}`}
            </h3>
            <p className="text-sm text-gray-600">
              Code INSEE: {communeData.insee}
            </p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="glass-light rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(communeData.totalObs)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Observations
          </div>
        </div>
        
        <div className="glass-light rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(communeData.totalEsp)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Espèces
          </div>
        </div>
      </div>

      {/* Détails supplémentaires (collapsible) */}
      {isExpanded && (
        <div className="animate-slide-up space-y-3 mb-4">
          <div className="text-sm text-gray-600">
            <strong>Période d'observation:</strong> 
            {communeData.observations.length > 0 && (
              <span className="ml-1">
                {Math.min(...communeData.observations.map(o => o['An Obs']))} - 
                {Math.max(...communeData.observations.map(o => o['An Obs']))}
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Données phénologiques:</strong> 
            <span className="ml-1">{communeData.phenologie.length} entrées</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCardClick}
          className="glass-button flex-1 flex items-center justify-center gap-2 text-gray-700 text-sm"
        >
          <Eye size={16} />
          {isExpanded ? 'Réduire' : 'Détails'}
        </button>
        
        <button
          onClick={onViewDetails}
          className="glass-button flex-1 flex items-center justify-center gap-2 text-blue-700 text-sm font-medium"
        >
          <BarChart3 size={16} />
          Fiche complète
        </button>
      </div>
    </div>
  )
} 