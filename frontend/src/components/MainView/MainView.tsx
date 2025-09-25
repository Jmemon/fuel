import { useState } from 'react'
import { LogFeed } from './LogFeed'
import { ManualLogForm } from './ManualLogForm'

export function MainView() {
    const [currentView, setCurrentView] = useState<'logs' | 'create'>('logs')

    return (
        <main className="main-view">
            <div className="main-view-header">
                <div className="view-controls">
                    <button
                        className={`btn ${currentView === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentView('logs')}
                    >
                        Activity Logs
                    </button>
                    <button
                        className={`btn ${currentView === 'create' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentView('create')}
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