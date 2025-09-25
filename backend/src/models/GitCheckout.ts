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

export interface CreateCheckoutData {
    activity_id: string
    repo_id: string
    timestamp: string
    prev_head: string
    new_head: string
    prev_branch: string
    new_branch: string
    repo_path: string
    repo_name: string
}

export class GitCheckout {
    static async findByActivityId(activityId: string): Promise<GitCheckoutRow | null> {
        const results = await db`SELECT * FROM git_checkouts WHERE activity_id = ${activityId}`
        return (results[0] as GitCheckoutRow) || null
    }

    static async create(data: CreateCheckoutData): Promise<GitCheckoutRow> {
        const results = await db`
            INSERT INTO git_checkouts (activity_id, repo_id, timestamp, prev_head, new_head, prev_branch, new_branch, repo_path, repo_name)
            VALUES (${data.activity_id}, ${data.repo_id}, ${data.timestamp}, ${data.prev_head}, ${data.new_head}, ${data.prev_branch}, ${data.new_branch}, ${data.repo_path}, ${data.repo_name})
            RETURNING *
        `
        return results[0] as GitCheckoutRow
    }

    static async delete(activityId: string): Promise<boolean> {
        const result = await db`DELETE FROM git_checkouts WHERE activity_id = ${activityId}`
        return result.count > 0
    }
}