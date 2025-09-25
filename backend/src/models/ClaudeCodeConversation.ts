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

export interface CreateConversationData {
    activity_id: string
    project_directory_name?: string
    conversation_file_path: string
    raw_jsonl?: string
    parsed_content?: object
    bullet_points?: string[]
    num_exchanges?: number
    num_tool_usages?: number
    num_tokens?: number
    started_at?: Date
    ended_at?: Date
    metadata?: object
}

export class ClaudeCodeConversation {
    static async findByActivityId(activityId: string): Promise<ClaudeCodeConversationRow | null> {
        const results = await db`SELECT * FROM claude_code_conversations WHERE activity_id = ${activityId}`
        return (results[0] as ClaudeCodeConversationRow) || null
    }

    static async create(data: CreateConversationData): Promise<ClaudeCodeConversationRow> {
        const results = await db`
            INSERT INTO claude_code_conversations (activity_id, project_directory_name, conversation_file_path, raw_jsonl, parsed_content, bullet_points, num_exchanges, num_tool_usages, num_tokens, started_at, ended_at, metadata)
            VALUES (${data.activity_id}, ${data.project_directory_name || null}, ${data.conversation_file_path}, ${data.raw_jsonl || null}, ${JSON.stringify(data.parsed_content) || null}, ${JSON.stringify(data.bullet_points) || null}, ${data.num_exchanges || 0}, ${data.num_tool_usages || 0}, ${data.num_tokens || 0}, ${data.started_at || null}, ${data.ended_at || null}, ${JSON.stringify(data.metadata) || null})
            RETURNING *
        `
        return results[0] as ClaudeCodeConversationRow
    }

    static async delete(activityId: string): Promise<boolean> {
        const result = await db`DELETE FROM claude_code_conversations WHERE activity_id = ${activityId}`
        return result.count > 0
    }
}