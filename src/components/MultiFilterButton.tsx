'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

interface MultiFilterButtonProps {
  filterType: 'selectedMois' | 'selectedRedListCategory' | 'selectedStatutReglementaire'
  currentValue: number | string | number[] | string[] | null
  availableOptions: Array<{ value: number | string, label: string }>
  title: string
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function MultiFilterButton({ 
  filterType, 
  currentValue, 
  availableOptions, 
  title 
}: MultiFilterButtonProps) {
  const { setFilter } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedValues, setSelectedValues] = useState<(number | string)[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  // Initialiser les valeurs sélectionnées
  useEffect(() => {
    if (currentValue) {
      if (Array.isArray(currentValue)) {
        setSelectedValues(currentValue)
      } else {
        setSelectedValues([currentValue])
      }
    } else {
      setSelectedValues([])
    }
  }, [currentValue])

  const handleButtonClick = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsAnimating(false)
      setShowModal(true)
    }, 360)
  }

  const handleToggleValue = (value: number | string) => {
    setSelectedValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const handleApply = () => {
    if (selectedValues.length === 0) {
      setFilter(filterType, null)
    } else if (selectedValues.length === 1) {
      setFilter(filterType, selectedValues[0])
    } else {
      setFilter(filterType, selectedValues as any)
    }
    setShowModal(false)
  }

  const handleCancel = () => {
    // Restaurer les valeurs précédentes
    if (currentValue) {
      if (Array.isArray(currentValue)) {
        setSelectedValues(currentValue)
      } else {
        setSelectedValues([currentValue])
      }
    } else {
      setSelectedValues([])
    }
    setShowModal(false)
  }

  const getValueLabel = (value: number | string): string => {
    if (filterType === 'selectedMois' && typeof value === 'number') {
      return MONTH_NAMES[value - 1] || value.toString()
    }
    return value.toString()
  }

  // Ne pas afficher le bouton si aucune valeur n'est sélectionnée
  if (!currentValue) {
    return null
  }

  return (
    <>
      {/* Bouton + avec animation */}
      <button
        onClick={handleButtonClick}
        className={`ml-2 w-6 h-6 rounded-full bg-white text-sm font-bold transition-all duration-300 hover:shadow-lg flex items-center justify-center ${
          isAnimating ? 'animate-spin' : ''
        }`}
        style={{
          background: 'linear-gradient(135deg, #cd853f, #2d5016)',
          color: 'white'
        }}
        title={`Ajouter d'autres ${title.toLowerCase()}`}
      >
        +
      </button>

      {/* Modal de sélection multiple */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="modern-card shadow-2xl rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gradient mb-4 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Sélection multiple - {title}
            </h3>

            <div className="mb-6 p-4 rounded-xl border border-amber-200/50" style={{
              background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(45, 80, 22, 0.1))'
            }}>
              <p className="text-sm font-medium" style={{
                background: 'linear-gradient(135deg, #cd853f, #2d5016)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Sélectionnez une ou plusieurs valeurs pour affiner votre recherche
              </p>
            </div>

            {/* Liste des options */}
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {availableOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleToggleValue(option.value)}
                    className="w-4 h-4 rounded border-2 border-amber-600 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="flex-1 font-medium text-gray-700">
                    {getValueLabel(option.value)}
                  </span>
                </label>
              ))}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 rounded-xl text-white font-medium transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #cd853f, #2d5016)'
                }}
              >
                Appliquer ({selectedValues.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 