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

export interface CreateRepoData {
    name: string
    local_repo_path: string
    remote_url?: string
    is_active?: boolean
}

export class ConnectedLocalGitRepo {
    static async findAll(): Promise<ConnectedLocalGitRepoRow[]> {
        const results = await db`SELECT * FROM connected_local_git_repos ORDER BY created_at DESC`
        return results as unknown as ConnectedLocalGitRepoRow[]
    }

    static async findActive(): Promise<ConnectedLocalGitRepoRow[]> {
        const results = await db`SELECT * FROM connected_local_git_repos WHERE is_active = true ORDER BY created_at DESC`
        return results as unknown as ConnectedLocalGitRepoRow[]
    }

    static async findByPath(path: string): Promise<ConnectedLocalGitRepoRow | null> {
        const results = await db`SELECT * FROM connected_local_git_repos WHERE local_repo_path = ${path}`
        return (results[0] as ConnectedLocalGitRepoRow) || null
    }

    static async create(data: CreateRepoData): Promise<ConnectedLocalGitRepoRow> {
        const results = await db`
            INSERT INTO connected_local_git_repos (name, local_repo_path, remote_url, is_active)
            VALUES (${data.name}, ${data.local_repo_path}, ${data.remote_url || null}, ${data.is_active || true})
            RETURNING *
        `
        return results[0] as ConnectedLocalGitRepoRow
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db`DELETE FROM connected_local_git_repos WHERE id = ${id}`
        return result.count > 0
    }
}