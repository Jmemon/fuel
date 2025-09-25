import { ActivityLog, ManualLog, ActivityLogFilters, ActivityLogRow, CreateActivityLogData, UpdateActivityLogData } from '../models'
import { UpdateActivityLogRequest } from '../types/api'

export class DatabaseService {
    static async getActivityLogs(filters?: ActivityLogFilters): Promise<{log: ActivityLogRow, manualLog?: any}[]> {
        const logs = await ActivityLog.findAll(filters)
        const results = []

        for (const log of logs) {
            const result: any = { log }

            if (log.type === 'manual') {
                const manualLog = await ManualLog.findByActivityId(log.id)
                if (manualLog) {
                    result.manualLog = manualLog
                }
            }

            results.push(result)
        }

        return results
    }

    static async createManualLog(content: string): Promise<{log: ActivityLogRow, manualLog: any}> {
        const activityLog = await ActivityLog.create({ type: 'manual' })
        const manualLog = await ManualLog.create(activityLog.id, content)

        return { log: activityLog, manualLog }
    }

    static async updateManualLog(id: string, data: UpdateActivityLogRequest): Promise<{log: ActivityLogRow | null, manualLog?: any}> {
        const result: any = {}

        if (data.reviewed !== undefined) {
            result.log = await ActivityLog.update(id, {
                reviewed: data.reviewed,
                reviewed_at: data.reviewed ? new Date() : undefined
            })
        }

        if (data.details?.content) {
            result.manualLog = await ManualLog.update(id, data.details.content)
        }

        if (!result.log) {
            result.log = await ActivityLog.findById(id)
        }

        return result
    }

    static async deleteActivityLog(id: string): Promise<void> {
        const log = await ActivityLog.findById(id)
        if (!log) {
            throw new Error('Activity log not found')
        }

        // Cascade DELETE is handled by database constraints
        await ActivityLog.delete(id)
    }

    static async markLogsAsReviewed(ids: string[]): Promise<ActivityLogRow[]> {
        return await ActivityLog.markAsReviewed(ids)
    }
}