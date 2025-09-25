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

export interface CreateGitCommitData {
    activity_id: string
    repo_id: string
    commit_hash: string
    message: string
    author_name?: string
    author_email?: string
    committed_at: Date
    files_changed?: string[]
    metadata?: object
}

export class GitCommit {
    static async findByActivityId(activityId: string): Promise<GitCommitRow | null> {
        const results = await db`SELECT * FROM git_commits WHERE activity_id = ${activityId}`
        return (results[0] as GitCommitRow) || null
    }

    static async create(data: CreateGitCommitData): Promise<GitCommitRow> {
        const results = await db`
            INSERT INTO git_commits (activity_id, repo_id, commit_hash, message, author_name, author_email, committed_at, files_changed, metadata)
            VALUES (${data.activity_id}, ${data.repo_id}, ${data.commit_hash}, ${data.message}, ${data.author_name || null}, ${data.author_email || null}, ${data.committed_at}, ${JSON.stringify(data.files_changed) || null}, ${JSON.stringify(data.metadata) || null})
            RETURNING *
        `
        return results[0] as GitCommitRow
    }

    static async findByHash(hash: string, repoId: string): Promise<GitCommitRow | null> {
        const results = await db`SELECT * FROM git_commits WHERE commit_hash = ${hash} AND repo_id = ${repoId}`
        return (results[0] as GitCommitRow) || null
    }

    static async delete(activityId: string): Promise<boolean> {
        const result = await db`DELETE FROM git_commits WHERE activity_id = ${activityId}`
        return result.count > 0
    }
}