# V0.3 Database Implementation Schema

## Database Connection & Configuration

### database/migrations/001_initial_schema.sql
```sql
-- Tables are created in dependency order to handle foreign key relationships
CREATE TABLE connected_local_git_repos (...);
CREATE TABLE activity_logs (...);
CREATE TABLE manual_logs (...);
CREATE TABLE git_commits (...);
CREATE TABLE claude_code_conversations (...);
CREATE TABLE git_checkouts (...);
CREATE TABLE git_hooks_installed (...);
```

### database/migrations/002_add_indexes.sql
```sql
-- Performance indexes for common query patterns
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
-- ... all other indexes from requirements
```

## Backend Database Layer

### src/config/database.ts
```typescript
import postgres from 'postgres'

export class DatabaseConfig {
    private sql: postgres.Sql<{}>

    constructor(): calls [postgres]: initializes PostgreSQL connection with connection pooling

    public getConnection(): postgres.Sql<{}> : returns [sql]: provides database connection instance for queries
}

export const db = new DatabaseConfig().getConnection()
```
**dependencies**: postgres library

### src/models/ActivityLog.ts
```typescript
import { db } from '../config/database'

export interface ActivityLogRow {
    id: string
    type: 'manual' | 'git_commit' | 'claude_code' | 'git_checkout' | 'git_hook_install'
    reviewed: boolean
    created_at: Date
    reviewed_at: Date | null
}

export class ActivityLog {
    static async findAll(filters?: ActivityLogFilters): calls [db.query]: retrieves activity logs with optional date/type/reviewed filtering

    static async findById(id: string): calls [db.query]: retrieves single activity log by UUID

    static async create(data: CreateActivityLogData): calls [db.query]: creates new activity log entry with auto-generated UUID and timestamps

    static async update(id: string, data: UpdateActivityLogData): calls [db.query]: updates activity log reviewed status and reviewed_at timestamp

    static async markAsReviewed(ids: string[]): calls [db.query]: bulk updates multiple activity logs as reviewed with current timestamp
}
```
**dependencies**: DatabaseConfig.db

### src/models/ManualLog.ts
```typescript
import { db } from '../config/database'

export interface ManualLogRow {
    id: string
    activity_id: string
    content: string
    created_at: Date
    updated_at: Date
}

export class ManualLog {
    static async findByActivityId(activityId: string): calls [db.query]: retrieves manual log content for specific activity log

    static async create(activityId: string, content: string): calls [db.query]: creates manual log entry linked to activity log

    static async update(activityId: string, content: string): calls [db.query]: updates manual log content and updated_at timestamp
}
```
**dependencies**: DatabaseConfig.db

### src/models/ConnectedLocalGitRepo.ts
```typescript
import { db } from '../config/database'

export interface ConnectedLocalGitRepoRow {
    id: string
    name: string
    local_repo_path: string
    remote_url: string | null
    is_active: boolean
    created_at: Date
    updated_at: Date
}

export class ConnectedLocalGitRepo {
    static async findAll(): calls [db.query]: retrieves all connected git repositories

    static async findActive(): calls [db.query]: retrieves only active git repositories

    static async findByPath(path: string): calls [db.query]: finds repository by local path for git hook integration

    static async create(data: CreateRepoData): calls [db.query]: adds new git repository connection with auto-generated UUID
}
```
**dependencies**: DatabaseConfig.db

### src/models/GitCommit.ts
```typescript
import { db } from '../config/database'

export interface GitCommitRow {
    id: string
    activity_id: string
    repo_id: string
    commit_hash: string
    message: string
    author_name: string | null
    author_email: string | null
    committed_at: Date
    files_changed: string[] | null
    metadata: object | null
}

export class GitCommit {
    static async findByActivityId(activityId: string): calls [db.query]: retrieves git commit details for activity log display

    static async create(data: CreateGitCommitData): calls [db.query]: creates git commit record for future git integration

    static async findByHash(hash: string, repoId: string): calls [db.query]: prevents duplicate commit entries via unique constraint
}
```
**dependencies**: DatabaseConfig.db

### src/models/ClaudeCodeConversation.ts
```typescript
import { db } from '../config/database'

export interface ClaudeCodeConversationRow {
    id: string
    activity_id: string
    project_directory_name: string | null
    conversation_file_path: string
    raw_jsonl: string | null
    parsed_content: object | null
    bullet_points: string[] | null
    num_exchanges: number
    num_tool_usages: number
    num_tokens: number
    started_at: Date | null
    ended_at: Date | null
    metadata: object | null
}

export class ClaudeCodeConversation {
    static async findByActivityId(activityId: string): calls [db.query]: retrieves Claude Code conversation details for future integration

    static async create(data: CreateConversationData): calls [db.query]: creates Claude Code conversation record for future parsing
}
```
**dependencies**: DatabaseConfig.db

### src/models/GitCheckout.ts
```typescript
import { db } from '../config/database'

export interface GitCheckoutRow {
    id: string
    activity_id: string
    repo_id: string
    timestamp: string
    prev_head: string
    new_head: string
    prev_branch: string
    new_branch: string
    repo_path: string
    repo_name: string
    created_at: Date
}

export class GitCheckout {
    static async findByActivityId(activityId: string): calls [db.query]: retrieves git checkout details for future git hook integration

    static async create(data: CreateCheckoutData): calls [db.query]: creates git checkout record from post-checkout hook data
}
```
**dependencies**: DatabaseConfig.db

### src/models/GitHooksInstalled.ts
```typescript
import { db } from '../config/database'

export interface GitHooksInstalledRow {
    id: string
    activity_id: string
    repo_id: string
    hook_type: string
    hook_script_path: string | null
    installation_timestamp: Date
    repo_path: string
    repo_name: string
    metadata: object | null
    created_at: Date
}

export class GitHooksInstalled {
    static async findByRepo(repoId: string): calls [db.query]: retrieves installed git hooks for repository management

    static async create(data: CreateHookData): calls [db.query]: records git hook installation for future tracking
}
```
**dependencies**: DatabaseConfig.db