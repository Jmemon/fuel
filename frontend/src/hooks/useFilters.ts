import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { ActivityLogFilters } from '../types/api'

export function useFilters() {
    const { filters, setFilters, clearFilters } = useAppStore()
    const [tempFilters, setTempFilters] = useState<ActivityLogFilters>({})

    const applyFilters = () => {
        setFilters(tempFilters)
    }

    const resetFilters = () => {
        setTempFilters({})
        clearFilters()
    }

    const updateTempFilter = (key: keyof ActivityLogFilters, value: any) => {
        setTempFilters(prev => ({
            ...prev,
            [key]: value
        }))
    }

    return {
        filters,
        tempFilters,
        applyFilters,
        resetFilters,
        updateTempFilter
    }
}