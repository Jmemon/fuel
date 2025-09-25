import { useState } from 'react'
import { Header } from './components/Header/Header'
import { Sidebar } from './components/Sidebar/Sidebar'
import { MainView } from './components/MainView/MainView'
import './styles/index.css'

export function App() {
    const [isLogViewActive, setIsLogViewActive] = useState(true)

    const handleLogViewClick = () => {
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