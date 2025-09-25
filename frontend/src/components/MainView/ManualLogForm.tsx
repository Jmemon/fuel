import React, { useState } from 'react'
import { useAppStore } from '../../stores/appStore'

export function ManualLogForm() {
    const [content, setContent] = useState('')
    const { createManualLog, loading, error } = useAppStore()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!content.trim()) {
            return
        }

        try {
            await createManualLog(content.trim())
            setContent('')
        } catch (error) {
            // Error is handled by the store
        }
    }

    return (
        <div className="manual-log-form">
            <h2>Create Manual Log Entry</h2>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="content">Log Content:</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter your manual log content here..."
                        rows={6}
                        disabled={loading}
                        required
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !content.trim()}
                    >
                        {loading ? 'Creating...' : 'Create Log Entry'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setContent('')}
                        disabled={loading}
                    >
                        Clear
                    </button>
                </div>
            </form>
        </div>
    )
}