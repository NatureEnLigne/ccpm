'use client'

import { ReactNode } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export default function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between group">
      {/* Toggle switch moderne */}
      <div 
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full cursor-pointer transition-all duration-300 ease-in-out ${
          checked 
            ? 'bg-gradient-primary shadow-lg' 
            : 'bg-gray-300/70 hover:bg-gray-400/70'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        
        {/* Indicateur lumineux quand activé */}
        {checked && (
          <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-30 animate-pulse" />
        )}
      </div>
      
      {/* Label moderne */}
      <label 
        onClick={() => onChange(!checked)}
        className="font-medium text-gray-700 cursor-pointer transition-colors duration-200 group-hover:text-gray-900 select-none"
      >
        {label}
      </label>
    </div>
  )
} 