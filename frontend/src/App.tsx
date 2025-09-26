import { useState, useEffect } from 'react'
import { Header } from './components/Header/Header'
import { Sidebar } from './components/Sidebar/Sidebar'
import { MainView } from './components/MainView/MainView'
import { useComponentLogger } from './utils/logger'
import './styles/index.css'

export function App() {
    const componentLogger = useComponentLogger('App')
    const [isLogViewActive, setIsLogViewActive] = useState(true)

    // Component lifecycle logging
    useEffect(() => {
        componentLogger.mount({ isLogViewActive })

        return () => {
            componentLogger.unmount()
        }
    }, [])

    useEffect(() => {
        componentLogger.update(undefined, { isLogViewActive })
    }, [isLogViewActive])

    const handleLogViewClick = () => {
        componentLogger.action('log_view_click')
        setIsLogViewActive(true)
    }

    return (
        <div className="app">
            <Header showFilters={isLogViewActive} />

            <div className="app-body">
                <Sidebar
                    onLogViewClick={handleLogViewClick}
                    isLogViewActive={isLogViewActive}
                />

                <MainView />
            </div>
        </div>
    )
}