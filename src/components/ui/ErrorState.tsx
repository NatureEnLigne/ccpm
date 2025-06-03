'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export default function ErrorState({ 
  title = "Une erreur s'est produite",
  message = "Impossible de charger les données",
  onRetry,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`glass-card rounded-2xl p-8 text-center animate-scale-in ${className}`}>
      <div className="text-red-400 mb-4 flex justify-center">
        <AlertTriangle size={48} />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6">
        {message}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="glass-button inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
      )}
    </div>
  )
} 