import { ActivityLogResponse, ManualLogDetails } from '../../types/api'
import { useActivityLogs } from '../../hooks/useActivityLogs'

interface LogEntryProps {
    log: ActivityLogResponse
}

export function LogEntry({ log }: LogEntryProps) {
    const { deleteLog } = useActivityLogs()

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    const getTypeLabel = (type: string) => {
        const labels = {
            manual: 'Manual Log',
            git_commit: 'Git Commit',
            claude_code: 'Claude Code',
            git_checkout: 'Git Checkout',
            git_hook_install: 'Git Hook Install'
        }
        return labels[type as keyof typeof labels] || type
    }

    const renderDetails = () => {
        if (log.type === 'manual') {
            const details = log.details as ManualLogDetails
            return (
                <div className="log-content">
                    <p>{details.content}</p>
                </div>
            )
        }

        // For other types, show basic info
        return (
            <div className="log-content">
                <p>Details for {getTypeLabel(log.type)} coming soon...</p>
            </div>
        )
    }

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this log entry?')) {
            deleteLog(log.id)
        }
    }

    return (
        <div className={`log-entry ${!log.reviewed ? 'unreviewed' : ''}`}>
            <div className="log-entry-header">
                <div className="log-entry-meta">
                    <span className="log-type">{getTypeLabel(log.type)}</span>
                    <span className="log-date">{formatDate(log.created_at)}</span>
                    {!log.reviewed && <span className="unreviewed-badge">New</span>}
                </div>

                <div className="log-entry-actions">
                    <button
                        onClick={handleDelete}
                        className="btn btn-danger btn-small"
                        title="Delete log entry"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {renderDetails()}
        </div>
    )
}