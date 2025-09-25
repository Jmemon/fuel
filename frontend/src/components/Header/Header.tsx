import { FilterControls } from './FilterControls'

interface HeaderProps {
    showFilters: boolean
}

export function Header({ showFilters }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-content">
                <h1 className="header-title">Fuel</h1>
                {showFilters && <FilterControls />}
            </div>
        </header>
    )
}