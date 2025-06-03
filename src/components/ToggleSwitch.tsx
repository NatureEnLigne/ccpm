'use client'

import { ReactNode } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string | ReactNode
  disabled?: boolean
}

export default function ToggleSwitch({ checked, onChange, label, disabled = false }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
        `}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      <span className="text-sm font-medium text-gray-700 ml-3">
        {label}
      </span>
    </div>
  )
} 