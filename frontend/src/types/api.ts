export interface ActivityLogResponse {
    id: string
    type: 'manual' | 'git_commit' | 'claude_code' | 'git_checkout' | 'git_hook_install'
    reviewed: boolean
    created_at: string
    reviewed_at: string | null
    details: ManualLogDetails | GitCommitDetails | ClaudeCodeDetails | GitCheckoutDetails | GitHookDetails
}

export interface ManualLogDetails {
    content: string
}

export interface GitCommitDetails {
    commit_hash: string
    message: string
    author_name?: string
    author_email?: string
    committed_at: string
    files_changed?: string[]
}

export interface ClaudeCodeDetails {
    project_directory_name?: string
    conversation_file_path: string
    bullet_points?: string[]
    num_exchanges: number
    num_tool_usages: number
    num_tokens: number
    started_at?: string
    ended_at?: string
}

export interface GitCheckoutDetails {
    timestamp: string
    prev_head: string
    new_head: string
    prev_branch: string
    new_branch: string
    repo_path: string
    repo_name: string
}

export interface GitHookDetails {
    hook_type: string
    hook_script_path?: string
    installation_timestamp: string
    repo_path: string
    repo_name: string
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

export interface ActivityLogSearchRequest {
    filters?: ActivityLogFilters
}