import { z } from 'zod'

// Activity Log Types
export const ActivityLogTypeSchema = z.enum(['manual', 'git_commit', 'claude_code', 'git_checkout', 'git_hook_install'])
export type ActivityLogType = z.infer<typeof ActivityLogTypeSchema>

// Details Schemas
export const ManualLogDetailsSchema = z.object({
    content: z.string().min(1, 'Content cannot be empty').max(10000, 'Content cannot exceed 10000 characters')
})

export const GitCommitDetailsSchema = z.object({
    commit_hash: z.string(),
    message: z.string(),
    author_name: z.string().optional(),
    author_email: z.string().email().optional(),
    committed_at: z.string(),
    files_changed: z.array(z.string()).optional()
})

export const ClaudeCodeDetailsSchema = z.object({
    project_directory_name: z.string().optional(),
    conversation_file_path: z.string(),
    bullet_points: z.array(z.string()).optional(),
    num_exchanges: z.number().int().min(0),
    num_tool_usages: z.number().int().min(0),
    num_tokens: z.number().int().min(0),
    started_at: z.string().optional(),
    ended_at: z.string().optional()
})

export const GitCheckoutDetailsSchema = z.object({
    timestamp: z.string(),
    prev_head: z.string(),
    new_head: z.string(),
    prev_branch: z.string(),
    new_branch: z.string(),
    repo_path: z.string(),
    repo_name: z.string()
})

export const GitHookDetailsSchema = z.object({
    hook_type: z.string(),
    hook_script_path: z.string().optional(),
    installation_timestamp: z.string(),
    repo_path: z.string(),
    repo_name: z.string()
})

export const ActivityLogDetailsSchema = z.union([
    ManualLogDetailsSchema,
    GitCommitDetailsSchema,
    ClaudeCodeDetailsSchema,
    GitCheckoutDetailsSchema,
    GitHookDetailsSchema
])

export type ManualLogDetails = z.infer<typeof ManualLogDetailsSchema>
export type GitCommitDetails = z.infer<typeof GitCommitDetailsSchema>
export type ClaudeCodeDetails = z.infer<typeof ClaudeCodeDetailsSchema>
export type GitCheckoutDetails = z.infer<typeof GitCheckoutDetailsSchema>
export type GitHookDetails = z.infer<typeof GitHookDetailsSchema>
export type ActivityLogDetails = z.infer<typeof ActivityLogDetailsSchema>

// Response Schema
export const ActivityLogResponseSchema = z.object({
    id: z.string().uuid(),
    type: ActivityLogTypeSchema,
    reviewed: z.boolean(),
    created_at: z.string(),
    reviewed_at: z.string().nullable(),
    details: ActivityLogDetailsSchema
})

export type ActivityLogResponse = z.infer<typeof ActivityLogResponseSchema>

// Filter Schema
export const ActivityLogFiltersSchema = z.object({
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    reviewed: z.boolean().optional(),
    type: ActivityLogTypeSchema.optional()
}).optional()

export type ActivityLogFilters = z.infer<typeof ActivityLogFiltersSchema>

// Request Schemas
export const CreateManualLogRequestSchema = z.object({
    details: ManualLogDetailsSchema
})

export const UpdateActivityLogRequestSchema = z.object({
    details: ManualLogDetailsSchema.optional(),
    reviewed: z.boolean().optional()
})

export const ActivityLogSearchRequestSchema = z.object({
    filters: ActivityLogFiltersSchema
})

export const UUIDSchema = z.string().uuid('Invalid UUID format')

export type CreateManualLogRequest = z.infer<typeof CreateManualLogRequestSchema>
export type UpdateActivityLogRequest = z.infer<typeof UpdateActivityLogRequestSchema>
export type ActivityLogSearchRequest = z.infer<typeof ActivityLogSearchRequestSchema>