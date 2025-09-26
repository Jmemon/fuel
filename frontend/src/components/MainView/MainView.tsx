import { useState, useEffect } from 'react'
import { LogFeed } from './LogFeed'
import { ManualLogForm } from './ManualLogForm'
import { useComponentLogger, logger } from '../../utils/logger'

export function MainView() {
    const componentLogger = useComponentLogger('MainView')
    const [currentView, setCurrentView] = useState<'logs' | 'create'>('logs')

    // Component lifecycle logging
    useEffect(() => {
        componentLogger.mount({ currentView })

        return () => {
            componentLogger.unmount()
        }
    }, [])

    useEffect(() => {
        componentLogger.action('view_changed', { newView: currentView })
        logger.userAction('changed_view', 'main-view-controls', { view: currentView })
    }, [currentView])

    const handleViewChange = (view: 'logs' | 'create') => {
        componentLogger.action('user_clicked_view_button', { targetView: view, currentView })
        logger.userAction('click', `view-button-${view}`, { previousView: currentView, newView: view })
        setCurrentView(view)
    }

    return (
        <main className="main-view">
            <div className="main-view-header">
                <div className="view-controls">
                    <button
                        className={`btn ${currentView === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleViewChange('logs')}
                    >
                        Activity Logs
                    </button>
                    <button
                        className={`btn ${currentView === 'create' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleViewChange('create')}
                    >
                        Create Manual Log
                    </button>
                </div>
            </div>

            <div className="main-view-content">
                {currentView === 'logs' ? <LogFeed /> : <ManualLogForm />}
            </div>
        </main>
    )
}