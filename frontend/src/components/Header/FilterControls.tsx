import { useFilters } from '../../hooks/useFilters'

export function FilterControls() {
    const { tempFilters, applyFilters, resetFilters, updateTempFilter } = useFilters()

    return (
        <div className="filter-controls">
            <div className="filter-group">
                <label htmlFor="from-date">From Date:</label>
                <input
                    type="date"
                    id="from-date"
                    value={tempFilters.from_date || ''}
                    onChange={(e) => updateTempFilter('from_date', e.target.value)}
                />
            </div>

            <div className="filter-group">
                <label htmlFor="to-date">To Date:</label>
                <input
                    type="date"
                    id="to-date"
                    value={tempFilters.to_date || ''}
                    onChange={(e) => updateTempFilter('to_date', e.target.value)}
                />
            </div>

            <div className="filter-group">
                <label htmlFor="type-filter">Type:</label>
                <select
                    id="type-filter"
                    value={tempFilters.type || ''}
                    onChange={(e) => updateTempFilter('type', e.target.value || undefined)}
                >
                    <option value="">All Types</option>
                    <option value="manual">Manual</option>
                    <option value="git_commit">Git Commit</option>
                    <option value="claude_code">Claude Code</option>
                    <option value="git_checkout">Git Checkout</option>
                    <option value="git_hook_install">Git Hook Install</option>
                </select>
            </div>

            <div className="filter-actions">
                <button onClick={applyFilters} className="btn btn-primary">Apply</button>
                <button onClick={resetFilters} className="btn btn-secondary">Clear</button>
            </div>
        </div>
    )
}