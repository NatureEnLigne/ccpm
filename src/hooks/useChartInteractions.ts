'use client'

import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { ChartInteraction, FilterEvent } from '../types'

export function useChartInteractions() {
  const { 
    setHoverState, 
    clearHoverState, 
    applyFilterEvent, 
    filters,
    hoverState 
  } = useAppStore()
  
  // Gestionnaire de clic sur les graphiques
  const handleChartClick = useCallback((interaction: ChartInteraction) => {
    const { chartType, dataKey, value } = interaction
    
    let filterEvent: FilterEvent | null = null
    
    // Mapping des clics vers les filtres appropriés
    switch (chartType) {
      case 'bubble':
        if (dataKey === 'group') {
          filterEvent = {
            filterKey: 'selectedGroupe',
            value: value as string,
            source: 'GroupBubble'
          }
        }
        break
        
      case 'line':
        if (dataKey === 'month') {
          filterEvent = {
            filterKey: 'selectedMois',
            value: value as number,
            source: 'PhenoLine'
          }
        }
        break
        
      case 'bar':
        if (dataKey === 'status') {
          filterEvent = {
            filterKey: 'selectedRedListCategory',
            value: value as string,
            source: 'RedListBar'
          }
        }
        break
        
      case 'treemap':
        if (dataKey === 'status') {
          filterEvent = {
            filterKey: 'selectedStatutReglementaire',
            value: value as string,
            source: 'StatusTreemap'
          }
        } else if (dataKey === 'ordre') {
          filterEvent = {
            filterKey: 'selectedOrdre',
            value: value as string,
            source: 'StatusTreemap'
          }
        } else if (dataKey === 'famille') {
          filterEvent = {
            filterKey: 'selectedFamille',
            value: value as string,
            source: 'StatusTreemap'
          }
        }
        break
    }
    
    if (filterEvent) {
      applyFilterEvent(filterEvent)
    }
  }, [applyFilterEvent])
  
  // Gestionnaire de hover sur les graphiques
  const handleChartHover = useCallback((interaction: ChartInteraction | null) => {
    if (interaction) {
      setHoverState({
        chartType: interaction.chartType,
        dataKey: interaction.dataKey,
        value: interaction.value
      })
    } else {
      clearHoverState()
    }
  }, [setHoverState, clearHoverState])
  
  // Vérifier si un élément est filtré/sélectionné
  const isFiltered = useCallback((chartType: string, dataKey: string, value: string | number) => {
    switch (`${chartType}-${dataKey}`) {
      case 'bubble-group':
        return filters.selectedGroupe === value
      case 'line-month':
        return filters.selectedMois === value
      case 'bar-status':
        return filters.selectedRedListCategory === value
      case 'treemap-status':
        return filters.selectedStatutReglementaire === value
      case 'treemap-ordre':
        return filters.selectedOrdre === value
      case 'treemap-famille':
        return filters.selectedFamille === value
      default:
        return false
    }
  }, [filters])
  
  // Vérifier si un élément est en hover
  const isHovered = useCallback((chartType: string, dataKey: string, value: string | number) => {
    return hoverState.chartType === chartType && 
           hoverState.dataKey === dataKey && 
           hoverState.value === value
  }, [hoverState])
  
  return {
    handleChartClick,
    handleChartHover,
    isFiltered,
    isHovered,
    filters,
    hoverState
  }
} 