import { db } from '../config/database'

export interface ActivityLogRow {
    id: string
    type: 'manual' | 'git_commit' | 'claude_code' | 'git_checkout' | 'git_hook_install'
    reviewed: boolean
    created_at: Date
    reviewed_at: Date | null
}

export interface ActivityLogFilters {
    from_date?: string
    to_date?: string
    reviewed?: boolean
    type?: string
}

export interface CreateActivityLogData {
    type: ActivityLogRow['type']
    reviewed?: boolean
}

export interface UpdateActivityLogData {
    reviewed?: boolean
    reviewed_at?: Date | undefined
}

export class ActivityLog {
    static async findAll(filters?: ActivityLogFilters): Promise<ActivityLogRow[]> {
        let query = `SELECT * FROM activity_logs WHERE 1=1`
        const params: any[] = []
        let paramCount = 0

        if (filters?.from_date) {
            query += ` AND created_at >= $${++paramCount}`
            params.push(filters.from_date)
        }
        if (filters?.to_date) {
            query += ` AND created_at <= $${++paramCount}`
            params.push(filters.to_date)
        }
        if (filters?.reviewed !== undefined) {
            query += ` AND reviewed = $${++paramCount}`
            params.push(filters.reviewed)
        }
        if (filters?.type) {
            query += ` AND type = $${++paramCount}`
            params.push(filters.type)
        }

        query += ` ORDER BY created_at DESC`

        return await db.unsafe(query, params) as ActivityLogRow[]
    }

    static async findById(id: string): Promise<ActivityLogRow | null> {
        const results = await db`SELECT * FROM activity_logs WHERE id = ${id}`
        return results[0] as ActivityLogRow || null
    }

    static async create(data: CreateActivityLogData): Promise<ActivityLogRow> {
        const results = await db`
            INSERT INTO activity_logs (type, reviewed)
            VALUES (${data.type}, ${data.reviewed || false})
            RETURNING *
        `
        return results[0] as ActivityLogRow
    }

    static async update(id: string, data: UpdateActivityLogData): Promise<ActivityLogRow | null> {
        const results = await db`
            UPDATE activity_logs
            SET reviewed = ${data.reviewed || false}, reviewed_at = ${data.reviewed_at || null}
            WHERE id = ${id}
            RETURNING *
        `
        return results[0] as ActivityLogRow || null
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db`DELETE FROM activity_logs WHERE id = ${id}`
        return result.count > 0
    }

    static async markAsReviewed(ids: string[]): Promise<ActivityLogRow[]> {
        if (ids.length === 0) return []

        const results = await db`
            UPDATE activity_logs
            SET reviewed = true, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ANY(${ids})
            RETURNING *
        `
        return results as unknown as ActivityLogRow[]
    }
}