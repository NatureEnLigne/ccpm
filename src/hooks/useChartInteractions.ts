'use client'

import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { isValueInFilter } from '../utils/filterHelpers'
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
        } else if (dataKey === 'group2') {
          filterEvent = {
            filterKey: 'selectedGroup2',
            value: value as string,
            source: 'GroupBubble'
          }
        } else if (dataKey === 'ordre') {
          filterEvent = {
            filterKey: 'selectedOrdre',
            value: value as string,
            source: 'GroupBubble'
          }
        } else if (dataKey === 'famille') {
          filterEvent = {
            filterKey: 'selectedFamille',
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
        } else if (dataKey === 'group') {
          filterEvent = {
            filterKey: 'selectedGroupe',
            value: value as string,
            source: 'ObservationsAnnuellesBar'
          }
        } else if (dataKey === 'group2') {
          filterEvent = {
            filterKey: 'selectedGroup2',
            value: value as string,
            source: 'ObservationsAnnuellesBar'
          }
        } else if (dataKey === 'ordre') {
          filterEvent = {
            filterKey: 'selectedOrdre',
            value: value as string,
            source: 'ObservationsAnnuellesBar'
          }
        } else if (dataKey === 'famille') {
          filterEvent = {
            filterKey: 'selectedFamille',
            value: value as string,
            source: 'ObservationsAnnuellesBar'
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
      case 'bubble-group2':
        return filters.selectedGroup2 === value
      case 'bubble-ordre':
        return filters.selectedOrdre === value
      case 'bubble-famille':
        return filters.selectedFamille === value
      case 'line-month':
        return isValueInFilter(filters.selectedMois, value as number)
      case 'bar-status':
        return isValueInFilter(filters.selectedRedListCategory, value as string)
      case 'bar-group':
        return filters.selectedGroupe === value
      case 'bar-group2':
        return filters.selectedGroup2 === value
      case 'bar-ordre':
        return filters.selectedOrdre === value
      case 'bar-famille':
        return filters.selectedFamille === value
      case 'treemap-status':
        return isValueInFilter(filters.selectedStatutReglementaire, value as string)
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