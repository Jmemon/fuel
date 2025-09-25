import { create } from 'zustand'
import { apiService } from '../services/api'
import { ActivityLogResponse, ActivityLogFilters, UpdateActivityLogRequest } from '../types/api'

interface AppState {
    activityLogs: ActivityLogResponse[]
    filters: ActivityLogFilters
    loading: boolean
    error: string | null
}

interface AppActions {
    setFilters: (filters: ActivityLogFilters) => void
    loadActivityLogs: () => Promise<void>
    createManualLog: (content: string) => Promise<void>
    updateActivityLog: (id: string, data: UpdateActivityLogRequest) => Promise<void>
    deleteActivityLog: (id: string) => Promise<void>
    markLogsAsReviewed: (ids: string[]) => Promise<void>
    clearFilters: () => void
    setError: (error: string | null) => void
    setLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
    // State
    activityLogs: [],
    filters: {},
    loading: false,
    error: null,

    // Actions
    setFilters: (filters) => {
        set({ filters })
        get().loadActivityLogs()
    },

    loadActivityLogs: async () => {
        const state = get()
        set({ loading: true, error: null })

        try {
            const logs = await apiService.getActivityLogs(state.filters)
            set({ activityLogs: logs })
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load activity logs' })
        } finally {
            set({ loading: false })
        }
    },

    createManualLog: async (content) => {
        set({ loading: true, error: null })

        try {
            await apiService.createManualLog(content)
            await get().loadActivityLogs()
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to create manual log' })
            set({ loading: false })
        }
    },

    updateActivityLog: async (id, data) => {
        set({ loading: true, error: null })

        try {
            await apiService.updateActivityLog(id, data)
            await get().loadActivityLogs()
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update activity log' })
            set({ loading: false })
        }
    },

    deleteActivityLog: async (id) => {
        set({ loading: true, error: null })

        try {
            await apiService.deleteActivityLog(id)
            await get().loadActivityLogs()
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete activity log' })
            set({ loading: false })
        }
    },

    markLogsAsReviewed: async (ids) => {
        if (ids.length === 0) return

        try {
            for (const id of ids) {
                await apiService.updateActivityLog(id, { reviewed: true })
            }
            await get().loadActivityLogs()
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to mark logs as reviewed' })
        }
    },

    clearFilters: () => {
        set({ filters: {} })
        get().loadActivityLogs()
    },

    setError: (error) => set({ error }),
    setLoading: (loading) => set({ loading }),
}))