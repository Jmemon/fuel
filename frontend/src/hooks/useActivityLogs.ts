import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'

export function useActivityLogs() {
    const {
        activityLogs,
        loading,
        error,
        loadActivityLogs,
        deleteActivityLog,
        markLogsAsReviewed
    } = useAppStore()

    useEffect(() => {
        loadActivityLogs()
    }, [])

    const markUnreviewedAsReviewed = () => {
        const unreviewedIds = activityLogs
            .filter(log => !log.reviewed)
            .map(log => log.id)

        if (unreviewedIds.length > 0) {
            markLogsAsReviewed(unreviewedIds)
        }
    }

    const deleteLog = (id: string) => {
        deleteActivityLog(id)
    }

    return {
        activityLogs,
        loading,
        error,
        refresh: loadActivityLogs,
        markUnreviewedAsReviewed,
        deleteLog
    }
}