# Adding New Log Types to Fuel

This guide provides step-by-step instructions for adding new activity log types to the Fuel system. This document is designed to be used with an LLM to facilitate automated updates.

## Overview

The Fuel system supports various activity log types: `manual`, `git_commit`, `claude_code`, `git_checkout`, and `git_hook_install`. Each log type has its own database table for storing specific details while sharing a common `activity_logs` table for metadata.

## Steps to Add a New Log Type

### Step 1: Database Schema Changes

#### 1.1 Create Migration File
Create a new migration file `database/migrations/00X_add_{new_type}_table.sql`:

```sql
-- Replace {new_type} with your actual type name (e.g., file_system_change)
CREATE TABLE {new_type}s (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activity_logs(id) ON DELETE CASCADE,
    -- Add specific fields for your log type here
    -- Example fields:
    -- file_path TEXT NOT NULL,
    -- operation VARCHAR(50) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    -- file_size INTEGER,
    -- checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_{new_type}s_activity_id ON {new_type}s(activity_id);
-- Add other relevant indexes based on your fields
```

#### 1.2 Update Activity Log Type Constraint
Create migration file `database/migrations/00X_update_activity_log_types.sql`:

```sql
-- Drop the existing constraint
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_type_check;

-- Add the new constraint including your new type
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_type_check
    CHECK (type IN ('manual', 'git_commit', 'claude_code', 'git_checkout', 'git_hook_install', '{new_type}'));
```

### Step 2: Backend Model Creation

#### 2.1 Create Model File
Create `backend/src/models/{NewType}.ts`:

```typescript
import { db } from '../config/database'

export interface {NewType}Row {
    id: string
    activity_id: string
    // Add your specific fields here with proper types
    // Example:
    // file_path: string
    // operation: 'create' | 'update' | 'delete'
    // file_size: number | null
    // checksum: string | null
    created_at: Date
}

export interface Create{NewType}Data {
    activity_id: string
    // Add your specific fields here
    // Example:
    // file_path: string
    // operation: 'create' | 'update' | 'delete'
    // file_size?: number
    // checksum?: string
}

export class {NewType} {
    static async findByActivityId(activityId: string): Promise<{NewType}Row | null> {
        const results = await db`SELECT * FROM {new_type}s WHERE activity_id = ${activityId}`
        return results[0] || null
    }

    static async create(data: Create{NewType}Data): Promise<{NewType}Row> {
        const results = await db`
            INSERT INTO {new_type}s (activity_id, /* add your fields */)
            VALUES (${data.activity_id}, /* add your values */)
            RETURNING *
        `
        return results[0]
    }

    static async delete(activityId: string): Promise<boolean> {
        const result = await db`DELETE FROM {new_type}s WHERE activity_id = ${activityId}`
        return result.count > 0
    }

    // Add other methods as needed (update, findAll, etc.)
}
```

#### 2.2 Update Models Index
Add to `backend/src/models/index.ts`:

```typescript
export * from './{NewType}'
```

### Step 3: Update Type Definitions and Validation

#### 3.1 Update API Types
In `backend/src/types/api.ts`, add:

```typescript
// Add to the ActivityLogTypeSchema enum
export const ActivityLogTypeSchema = z.enum([
    'manual',
    'git_commit',
    'claude_code',
    'git_checkout',
    'git_hook_install',
    '{new_type}' // Add your new type here
])

// Create details schema for your new type
export const {NewType}DetailsSchema = z.object({
    // Define validation rules for your fields
    // Example:
    // file_path: z.string().min(1, 'File path is required'),
    // operation: z.enum(['create', 'update', 'delete']),
    // file_size: z.number().int().min(0).optional(),
    // checksum: z.string().length(64).optional()
})

export type {NewType}Details = z.infer<typeof {NewType}DetailsSchema>

// Update the union type
export const ActivityLogDetailsSchema = z.union([
    ManualLogDetailsSchema,
    GitCommitDetailsSchema,
    ClaudeCodeDetailsSchema,
    GitCheckoutDetailsSchema,
    GitHookDetailsSchema,
    {NewType}DetailsSchema // Add your new schema here
])
```

### Step 4: Update Services

#### 4.1 Update DatabaseService
In `backend/src/services/DatabaseService.ts`, add handling for your new type:

```typescript
// Import your new model
import { {NewType} } from '../models'

// Update getActivityLogs method
static async getActivityLogs(filters?: ActivityLogFilters): Promise<{log: ActivityLogRow, manualLog?: any, {newType}?: any}[]> {
    const logs = await ActivityLog.findAll(filters)
    const results = []

    for (const log of logs) {
        const result: any = { log }

        if (log.type === 'manual') {
            const manualLog = await ManualLog.findByActivityId(log.id)
            if (manualLog) {
                result.manualLog = manualLog
            }
        }

        // Add your new type handling
        if (log.type === '{new_type}') {
            const {newType}Data = await {NewType}.findByActivityId(log.id)
            if ({newType}Data) {
                result.{newType} = {newType}Data
            }
        }

        // ... existing type handling ...

        results.push(result)
    }

    return results
}

// Add creation method
static async create{NewType}Log(data: Create{NewType}Data): Promise<{log: ActivityLogRow, {newType}: any}> {
    const activityLog = await ActivityLog.create({ type: '{new_type}' })
    const {newType}Log = await {NewType}.create({
        ...data,
        activity_id: activityLog.id
    })

    return { log: activityLog, {newType}: {newType}Log }
}
```

#### 4.2 Update ActivityLogService
In `backend/src/services/ActivityLogService.ts`, add:

```typescript
// Add creation method
static async create{NewType}Entry(data: Create{NewType}Data): Promise<ActivityLogResponse> {
    // Validate data using Zod
    const validation = {NewType}DetailsSchema.safeParse(data)
    if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message)
    }

    const result = await DatabaseService.create{NewType}Log(data)
    return this.formatLogResponse(result.log, undefined, result.{newType})
}

// Update formatLogResponse method to handle your new type
private static formatLogResponse(log: ActivityLogRow, manualLog?: any, {newType}?: any): ActivityLogResponse {
    const response: ActivityLogResponse = {
        id: log.id,
        type: log.type,
        reviewed: log.reviewed,
        created_at: log.created_at.toISOString(),
        reviewed_at: log.reviewed_at?.toISOString() || null,
        details: {}
    }

    if (log.type === 'manual' && manualLog) {
        response.details = { content: manualLog.content }
    }

    // Add handling for your new type
    if (log.type === '{new_type}' && {newType}) {
        response.details = {
            // Map your database fields to the response format
            // Example:
            // file_path: {newType}.file_path,
            // operation: {newType}.operation,
            // file_size: {newType}.file_size,
            // checksum: {newType}.checksum
        }
    }

    // ... existing type handling ...

    return response
}
```

### Step 5: Update Routes

#### 5.1 Add Route Handler
In `backend/src/routes/activityLogs.ts`, add:

```typescript
// Add validation middleware for your new type
import { validate{NewType}Request } from '../middleware/validation'

// Add route for creating your new log type
router.post('/{new_type}', validate{NewType}Request, async (req, res, next) => {
    try {
        const log = await ActivityLogService.create{NewType}Entry(req.body)
        res.status(201).json(log)
    } catch (error) {
        next(error)
    }
})
```

#### 5.2 Add Validation Middleware
In `backend/src/middleware/validation.ts`, add:

```typescript
export function validate{NewType}Request(req: Request, res: Response, next: NextFunction): void {
    const validation = {NewType}DetailsSchema.safeParse(req.body)

    if (!validation.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: validation.error.errors
        })
    }

    next()
}
```

### Step 6: Frontend Updates

#### 6.1 Update Frontend Types
In `frontend/src/types/api.ts`, add:

```typescript
// Update the type union
export interface ActivityLogResponse {
    id: string
    type: 'manual' | 'git_commit' | 'claude_code' | 'git_checkout' | 'git_hook_install' | '{new_type}'
    reviewed: boolean
    created_at: string
    reviewed_at: string | null
    details: ManualLogDetails | GitCommitDetails | ClaudeCodeDetails | GitCheckoutDetails | GitHookDetails | {NewType}Details
}

// Add your details interface
export interface {NewType}Details {
    // Define the same fields as in your backend schema
    // Example:
    // file_path: string
    // operation: 'create' | 'update' | 'delete'
    // file_size?: number
    // checksum?: string
}
```

#### 6.2 Update API Service
In `frontend/src/services/api.ts`, add:

```typescript
// Add method to create your new log type
async create{NewType}Log(data: {NewType}Details): Promise<ActivityLogResponse> {
    const response = await this.client.post('/api/v1/activity-logs/{new_type}', data)
    return response.data
}
```

#### 6.3 Update State Management
In `frontend/src/stores/appStore.ts`, add:

```typescript
// Add action for creating your new log type
create{NewType}Log: async (data: {NewType}Details) => {
    set({ loading: true, error: null })

    try {
        await apiService.create{NewType}Log(data)
        await get().loadActivityLogs()
    } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to create {new_type} log' })
        set({ loading: false })
    }
},
```

#### 6.4 Update Components

##### Update LogEntry Component
In `frontend/src/components/MainView/LogEntry.tsx`, add:

```typescript
// Update getTypeLabel function
const getTypeLabel = (type: string) => {
    const labels = {
        manual: 'Manual Log',
        git_commit: 'Git Commit',
        claude_code: 'Claude Code',
        git_checkout: 'Git Checkout',
        git_hook_install: 'Git Hook Install',
        {new_type}: '{Display Name}' // Add your display name
    }
    return labels[type as keyof typeof labels] || type
}

// Update renderDetails function
const renderDetails = () => {
    if (log.type === 'manual') {
        const details = log.details as ManualLogDetails
        return (
            <div className="log-content">
                <p>{details.content}</p>
            </div>
        )
    }

    // Add handling for your new type
    if (log.type === '{new_type}') {
        const details = log.details as {NewType}Details
        return (
            <div className="log-content">
                {/* Render your specific fields */}
                {/* Example:
                <p><strong>File:</strong> {details.file_path}</p>
                <p><strong>Operation:</strong> {details.operation}</p>
                {details.file_size && <p><strong>Size:</strong> {details.file_size} bytes</p>}
                */}
            </div>
        )
    }

    // ... existing type handling ...
}
```

##### Update Filter Controls
In `frontend/src/components/Header/FilterControls.tsx`, add:

```typescript
// Update the select options
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
    <option value="{new_type}">{Display Name}</option>
</select>
```

##### Create Form Component (Optional)
Create `frontend/src/components/MainView/{NewType}Form.tsx`:

```typescript
import React, { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { {NewType}Details } from '../../types/api'

export function {NewType}Form() {
    // Add state for your form fields
    const [formData, setFormData] = useState<{NewType}Details>({
        // Initialize with default values
    })

    const { create{NewType}Log, loading, error } = useAppStore()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await create{NewType}Log(formData)
            // Reset form or redirect
        } catch (error) {
            // Error handled by store
        }
    }

    return (
        <div className="{new_type}-form">
            <h2>Create {Display Name} Entry</h2>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Add form fields for your log type */}
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Entry'}
                </button>
            </form>
        </div>
    )
}
```

## Testing Your New Log Type

After implementing all changes:

1. **Database**: Run migrations and verify table creation
2. **Backend**: Test API endpoints with curl or Postman
3. **Frontend**: Verify form submission and display
4. **Integration**: Test the complete flow from creation to display

## Example Implementation Checklist

- [ ] Database migration created
- [ ] Activity log type constraint updated
- [ ] Backend model created and exported
- [ ] Type definitions and Zod schemas added
- [ ] DatabaseService updated
- [ ] ActivityLogService updated
- [ ] Route handlers added
- [ ] Validation middleware added
- [ ] Frontend types updated
- [ ] API service methods added
- [ ] Store actions added
- [ ] LogEntry component updated
- [ ] Filter controls updated
- [ ] Form component created (if needed)
- [ ] Testing completed

This guide provides a comprehensive framework for adding any new log type to the Fuel system while maintaining consistency and type safety throughout the application.