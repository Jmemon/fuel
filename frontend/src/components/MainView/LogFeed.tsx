import { useEffect } from 'react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { LogEntry } from './LogEntry'

export function LogFeed() {
    const { activityLogs, loading, error, markUnreviewedAsReviewed } = useActivityLogs()

    useEffect(() => {
        // Mark unreviewed logs as reviewed when viewing
        const timer = setTimeout(() => {
            markUnreviewedAsReviewed()
        }, 2000) // 2 second delay before marking as reviewed

        return () => clearTimeout(timer)
    }, [activityLogs, markUnreviewedAsReviewed])

    if (loading) {
        return <div className="loading">Loading activity logs...</div>
    }

    if (error) {
        return <div className="error">Error: {error}</div>
    }

    if (activityLogs.length === 0) {
        return <div className="empty-state">No activity logs found.</div>
    }

    return (
        <div className="log-feed">
            <div className="log-feed-header">
                <h2>Activity Logs ({activityLogs.length})</h2>
            </div>

            <div className="log-entries">
                {activityLogs.map((log) => (
                    <LogEntry key={log.id} log={log} />
                ))}
            </div>
        </div>
    )
}