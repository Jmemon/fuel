
interface SidebarProps {
    onLogViewClick: () => void
    isLogViewActive: boolean
}

export function Sidebar({ onLogViewClick, isLogViewActive }: SidebarProps) {
    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                <div
                    className={`sidebar-nav-item ${isLogViewActive ? 'active' : ''}`}
                    onClick={onLogViewClick}
                >
                    Logs
                </div>

                <div className="sidebar-section">
                    <h3>Future Features</h3>
                    <div className="sidebar-placeholder">
                        More features coming soon...
                    </div>
                </div>
            </nav>
        </aside>
    )
}