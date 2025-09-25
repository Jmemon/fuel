import { db } from '../config/database'

export interface ManualLogRow {
    id: string
    activity_id: string
    content: string
    created_at: Date
    updated_at: Date
}

export class ManualLog {
    static async findByActivityId(activityId: string): Promise<ManualLogRow | null> {
        const results = await db`SELECT * FROM manual_logs WHERE activity_id = ${activityId}`
        return results[0] as ManualLogRow || null
    }

    static async create(activityId: string, content: string): Promise<ManualLogRow> {
        const results = await db`
            INSERT INTO manual_logs (activity_id, content)
            VALUES (${activityId}, ${content})
            RETURNING *
        `
        return results[0] as ManualLogRow
    }

    static async update(activityId: string, content: string): Promise<ManualLogRow | null> {
        const results = await db`
            UPDATE manual_logs
            SET content = ${content}, updated_at = CURRENT_TIMESTAMP
            WHERE activity_id = ${activityId}
            RETURNING *
        `
        return results[0] as ManualLogRow || null
    }

    static async delete(activityId: string): Promise<boolean> {
        const result = await db`DELETE FROM manual_logs WHERE activity_id = ${activityId}`
        return result.count > 0
    }
}