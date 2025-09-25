# V0.5 Frontend & Backend Implementation Schema

## Backend API Layer

### src/types/api.ts
```typescript
export interface ActivityLogResponse {
    id: string
    type: 'manual' | 'git_commit' | 'claude_code' | 'git_checkout' | 'git_hook_install'
    reviewed: boolean
    created_at: string
    reviewed_at: string | null
    details: ManualLogDetails | GitCommitDetails | ClaudeCodeDetails
}

export interface ActivityLogFilters {
    from_date?: string
    to_date?: string
    reviewed?: boolean
    type?: string
}

export interface CreateManualLogRequest {
    details: { content: string }
}

export interface UpdateActivityLogRequest {
    details?: { content: string }
    reviewed?: boolean
}
```

### src/services/DatabaseService.ts
```typescript
import { db } from '../config/database'
import { ActivityLog, ManualLog } from '../models'

export class DatabaseService {
    static async getActivityLogs(filters: ActivityLogFilters): calls [ActivityLog.findAll, ManualLog.findByActivityId]: retrieves filtered activity logs with joined manual log content

    static async createManualLog(content: string): calls [ActivityLog.create, ManualLog.create]: creates activity log entry with type 'manual' and associated manual log content

    static async updateManualLog(id: string, data: UpdateActivityLogRequest): calls [ActivityLog.update, ManualLog.update]: updates manual log content and/or review status

    static async deleteActivityLog(id: string): calls [ActivityLog.findById, ManualLog.delete, ActivityLog.delete]: deletes activity log and associated manual log content with cascade handling

    static async markLogsAsReviewed(ids: string[]): calls [ActivityLog.markAsReviewed]: bulk marks activity logs as reviewed for default view
}
```
**dependencies**: DatabaseConfig.db, ActivityLog, ManualLog

### src/services/ActivityLogService.ts
```typescript
import { DatabaseService } from './DatabaseService'

export class ActivityLogService {
    static async getFilteredLogs(filters: ActivityLogFilters): calls [DatabaseService.getActivityLogs]: applies business logic for filtering and formatting activity logs

    static async getUnreviewedLogs(): calls [DatabaseService.getActivityLogs]: retrieves unreviewed logs for default view with automatic review marking

    static async createManualEntry(content: string): calls [DatabaseService.createManualLog]: validates and creates manual activity log entry

    static async updateEntry(id: string, data: UpdateActivityLogRequest): calls [DatabaseService.updateManualLog]: validates and updates manual log entry

    static async deleteEntry(id: string): calls [DatabaseService.deleteActivityLog]: validates entry exists and is deletable then removes activity log and associated data

    private static formatLogResponse(log: ActivityLogRow, details: any): transforms database rows into API response format

    private static validateManualContent(content: string): validates manual log content is not empty and within length limits

    private static validateEntryExists(id: string): throws NotFoundError if activity log doesn't exist or is not a manual log type
}
```
**dependencies**: DatabaseService

### src/middleware/validation.ts
```typescript
import { Request, Response, NextFunction } from 'express'

export function validateCreateManualLog(req: Request, res: Response, next: NextFunction): calls [next]: validates POST /activity-logs request body has required details.content field

export function validateUpdateActivityLog(req: Request, res: Response, next: NextFunction): calls [next]: validates PUT /activity-logs/:id request body format

export function validateQueryFilters(req: Request, res: Response, next: NextFunction): calls [next]: validates GET /activity-logs query parameters for date format and valid enum values

export function validateUUID(paramName: string): calls [next]: validates route parameters are valid UUIDs
```
**dependencies**: express

### src/middleware/errorHandler.ts
```typescript
import { Request, Response, NextFunction } from 'express'

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): logs error and sends appropriate HTTP status code with error message

export class ValidationError extends Error {
    constructor(message: string, public statusCode: number = 400): creates validation error with HTTP status code
}

export class NotFoundError extends Error {
    constructor(message: string): creates 404 error for missing resources
}
```
**dependencies**: express

### src/routes/activityLogs.ts
```typescript
import express from 'express'
import { ActivityLogService } from '../services/ActivityLogService'
import { validateCreateManualLog, validateUpdateActivityLog, validateQueryFilters, validateUUID } from '../middleware/validation'

const router = express.Router()

router.get('/', validateQueryFilters, async (req, res, next) => {
    // calls [ActivityLogService.getFilteredLogs]: handles GET /activity-logs with optional query filters
})

router.post('/', validateCreateManualLog, async (req, res, next) => {
    // calls [ActivityLogService.createManualEntry]: handles POST /activity-logs for manual log creation
})

router.put('/:id', validateUUID('id'), validateUpdateActivityLog, async (req, res, next) => {
    // calls [ActivityLogService.updateEntry]: handles PUT /activity-logs/:id for manual log updates
})

router.delete('/:id', validateUUID('id'), async (req, res, next) => {
    // calls [ActivityLogService.deleteEntry]: handles DELETE /activity-logs/:id for activity log deletion
})

export default router
```
**dependencies**: express, ActivityLogService, validation middleware

### src/index.ts
```typescript
import express from 'express'
import cors from 'cors'
import activityLogsRouter from './routes/activityLogs'
import { errorHandler } from './middleware/errorHandler'

export class Server {
    private app: express.Application

    constructor(): calls [express, cors]: initializes Express app with CORS middleware for frontend communication

    private setupMiddleware(): calls [app.use]: configures JSON parsing, CORS, and route mounting

    private setupRoutes(): calls [app.use]: mounts activity logs router at /api/v1/activity-logs

    private setupErrorHandling(): calls [app.use]: adds global error handler middleware

    public start(port: number): calls [app.listen]: starts HTTP server on specified port

    public getApp(): express.Application: returns Express app instance for testing
}

const server = new Server()
server.start(process.env.PORT ? parseInt(process.env.PORT) : 3001)
```
**dependencies**: express, cors, activityLogsRouter, errorHandler

## Frontend Layer

### src/types/api.ts
```typescript
// Same interfaces as backend for type consistency
export interface ActivityLogResponse {
    id: string
    type: 'manual' | 'git_commit' | 'claude_code' | 'git_checkout' | 'git_hook_install'
    reviewed: boolean
    created_at: string
    reviewed_at: string | null
    details: ManualLogDetails | GitCommitDetails | ClaudeCodeDetails
}

export interface ActivityLogFilters {
    from_date?: string
    to_date?: string
    reviewed?: boolean
    type?: string
}
```

### src/services/api.ts
```typescript
import axios from 'axios'

export class ApiService {
    private baseURL: string
    private client: axios.AxiosInstance

    constructor(): calls [axios.create]: initializes HTTP client with base URL from environment variables

    async getActivityLogs(filters?: ActivityLogFilters): calls [client.get]: fetches activity logs from GET /api/v1/activity-logs

    async createManualLog(content: string): calls [client.post]: creates manual log via POST /api/v1/activity-logs

    async updateActivityLog(id: string, data: UpdateActivityLogRequest): calls [client.put]: updates activity log via PUT /api/v1/activity-logs/:id

    async deleteActivityLog(id: string): calls [client.delete]: deletes activity log via DELETE /api/v1/activity-logs/:id

    private handleError(error: axios.AxiosError): formats API errors for UI consumption
}

export const apiService = new ApiService()
```
**dependencies**: axios

### src/stores/appStore.ts
```typescript
import { create } from 'zustand'
import { apiService } from '../services/api'

interface AppState {
    activityLogs: ActivityLogResponse[]
    filters: ActivityLogFilters
    loading: boolean
    error: string | null
}

interface AppActions {
    setFilters: (filters: ActivityLogFilters) => void
    loadActivityLogs: () => Promise<void>
    createManualLog: (content: string) => Promise<void>
    updateActivityLog: (id: string, data: UpdateActivityLogRequest) => Promise<void>
    deleteActivityLog: (id: string) => Promise<void>
    markLogsAsReviewed: (ids: string[]) => Promise<void>
    clearFilters: () => void
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
    // State
    activityLogs: [],
    filters: {},
    loading: false,
    error: null,

    // Actions
    setFilters: (filters) => { set({ filters }); get().loadActivityLogs() },
    loadActivityLogs: async () => calls [apiService.getActivityLogs]: fetches and updates activity logs state with current filters,
    createManualLog: async (content) => calls [apiService.createManualLog]: creates manual log and refreshes activity logs list,
    updateActivityLog: async (id, data) => calls [apiService.updateActivityLog]: updates activity log and refreshes list,
    deleteActivityLog: async (id) => calls [apiService.deleteActivityLog]: deletes activity log and refreshes activity logs list,
    markLogsAsReviewed: async (ids) => calls [apiService.updateActivityLog]: bulk marks logs as reviewed for default view,
    clearFilters: () => set({ filters: {} })
}))
```
**dependencies**: zustand, apiService

### src/hooks/useActivityLogs.ts
```typescript
import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'

export function useActivityLogs() {
    const { activityLogs, loading, error, loadActivityLogs, deleteActivityLog, markLogsAsReviewed } = useAppStore()

    useEffect(() => {
        loadActivityLogs()
    }, [])

    const markUnreviewedAsReviewed = (): calls [markLogsAsReviewed]: automatically marks unreviewed logs as reviewed for default view

    const deleteLog = (id: string): calls [deleteActivityLog]: deletes activity log and refreshes list

    return {
        activityLogs,
        loading,
        error,
        refresh: loadActivityLogs,
        markUnreviewedAsReviewed,
        deleteLog
    }
}
```
**dependencies**: react, useAppStore

### src/hooks/useFilters.ts
```typescript
import { useState } from 'react'
import { useAppStore } from '../stores/appStore'

export function useFilters() {
    const { filters, setFilters, clearFilters } = useAppStore()
    const [tempFilters, setTempFilters] = useState<ActivityLogFilters>({})

    const applyFilters = (): calls [setFilters]: applies temporary filter state to global store and triggers log refresh

    const resetFilters = (): calls [clearFilters]: clears all filters and resets to default view

    const updateTempFilter = (key: keyof ActivityLogFilters, value: any): updates temporary filter state without triggering API call

    return {
        filters,
        tempFilters,
        applyFilters,
        resetFilters,
        updateTempFilter
    }
}
```
**dependencies**: react, useAppStore

### src/components/Header/Header.tsx
```typescript
import React from 'react'
import { FilterControls } from './FilterControls'

interface HeaderProps {
    showFilters: boolean
}

export function Header({ showFilters }: HeaderProps): calls [FilterControls]: renders app title and conditional filter controls for log view

```
**dependencies**: react, FilterControls

### src/components/Header/FilterControls.tsx
```typescript
import React from 'react'
import { useFilters } from '../../hooks/useFilters'

export function FilterControls(): calls [useFilters]: renders date range picker and apply/clear buttons for activity log filtering

```
**dependencies**: react, useFilters

### src/components/Sidebar/Sidebar.tsx
```typescript
import React from 'react'

interface SidebarProps {
    onLogViewClick: () => void
    isLogViewActive: boolean
}

export function Sidebar({ onLogViewClick, isLogViewActive }: SidebarProps): renders navigation with Log View button and placeholder space for future features

```
**dependencies**: react

### src/components/MainView/MainView.tsx
```typescript
import React, { useState } from 'react'
import { LogFeed } from './LogFeed'
import { ManualLogForm } from './ManualLogForm'

export function MainView(): calls [LogFeed, ManualLogForm]: manages main content area switching between log feed and manual log creation form

```
**dependencies**: react, LogFeed, ManualLogForm

### src/components/MainView/LogFeed.tsx
```typescript
import React, { useEffect } from 'react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { LogEntry } from './LogEntry'

export function LogFeed(): calls [useActivityLogs, LogEntry]: renders chronologically organized activity logs with automatic review marking for default view

```
**dependencies**: react, useActivityLogs, LogEntry

### src/components/MainView/LogEntry.tsx
```typescript
import React from 'react'
import { useActivityLogs } from '../../hooks/useActivityLogs'

interface LogEntryProps {
    log: ActivityLogResponse
}

export function LogEntry({ log }: LogEntryProps): calls [useActivityLogs.deleteLog]: renders individual activity log entry with formatted date, time, type, content, and delete button

```
**dependencies**: react, useActivityLogs

### src/components/MainView/ManualLogForm.tsx
```typescript
import React, { useState } from 'react'
import { useAppStore } from '../../stores/appStore'

export function ManualLogForm(): calls [useAppStore.createManualLog]: renders form for creating manual activity log entries with content validation

```
**dependencies**: react, useAppStore

### src/App.tsx
```typescript
import React, { useState } from 'react'
import { Header } from './components/Header/Header'
import { Sidebar } from './components/Sidebar/Sidebar'
import { MainView } from './components/MainView/MainView'

export function App(): calls [Header, Sidebar, MainView]: orchestrates three-component layout and manages which view is active in main area

```
**dependencies**: react, Header, Sidebar, MainView

### src/main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```
**dependencies**: react, react-dom, App component