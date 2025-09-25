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

export interface CreateHookData {
    activity_id: string
    repo_id: string
    hook_type: string
    hook_script_path?: string
    installation_timestamp: Date
    repo_path: string
    repo_name: string
    metadata?: object
}

export class GitHooksInstalled {
    static async findByRepo(repoId: string): Promise<GitHooksInstalledRow[]> {
        const results = await db`SELECT * FROM git_hooks_installed WHERE repo_id = ${repoId} ORDER BY created_at DESC`
        return results as unknown as GitHooksInstalledRow[]
    }

    static async create(data: CreateHookData): Promise<GitHooksInstalledRow> {
        const results = await db`
            INSERT INTO git_hooks_installed (activity_id, repo_id, hook_type, hook_script_path, installation_timestamp, repo_path, repo_name, metadata)
            VALUES (${data.activity_id}, ${data.repo_id}, ${data.hook_type}, ${data.hook_script_path || null}, ${data.installation_timestamp}, ${data.repo_path}, ${data.repo_name}, ${JSON.stringify(data.metadata) || null})
            RETURNING *
        `
        return results[0] as GitHooksInstalledRow
    }

    static async delete(activityId: string): Promise<boolean> {
        const result = await db`DELETE FROM git_hooks_installed WHERE activity_id = ${activityId}`
        return result.count > 0
    }
}