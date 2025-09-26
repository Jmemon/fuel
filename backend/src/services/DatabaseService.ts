import { ActivityLog, ManualLog, ActivityLogFilters, ActivityLogRow, CreateActivityLogData, UpdateActivityLogData } from '../models'
import { UpdateActivityLogRequest } from '../types/api'
import { dbLogger } from '../utils/logger'
import logger from '../utils/logger'

export class DatabaseService {
    static async getActivityLogs(filters?: ActivityLogFilters): Promise<{log: ActivityLogRow, manualLog?: any}[]> {
        const startTime = Date.now()
        logger.debug('Fetching activity logs with filters', { filters })

        try {
            const logs = await ActivityLog.findAll(filters)
            logger.debug('Retrieved activity logs', { count: logs.length })

            const results = []

            for (const log of logs) {
                const result: any = { log }

                if (log.type === 'manual') {
                    logger.debug('Fetching manual log details', { activityId: log.id })
                    const manualLog = await ManualLog.findByActivityId(log.id)
                    if (manualLog) {
                        result.manualLog = manualLog
                    }
                }

                results.push(result)
            }

            const duration = Date.now() - startTime
            logger.debug('Activity logs fetch completed', {
                totalResults: results.length,
                manualLogs: results.filter(r => r.manualLog).length,
                duration
            })

            return results
        } catch (error) {
            dbLogger.error('getActivityLogs', error as Error, { filters })
            throw error
        }
    }

    static async createManualLog(content: string): Promise<{log: ActivityLogRow, manualLog: any}> {
        const startTime = Date.now()
        logger.debug('Creating manual log entry', { contentLength: content.length })

        try {
            const activityLog = await ActivityLog.create({ type: 'manual' })
            logger.debug('Created activity log record', { activityLogId: activityLog.id })

            const manualLog = await ManualLog.create(activityLog.id, content)
            logger.debug('Created manual log record', { manualLogId: manualLog.id })

            const duration = Date.now() - startTime
            logger.debug('Manual log creation completed', {
                activityLogId: activityLog.id,
                manualLogId: manualLog.id,
                duration
            })

            return { log: activityLog, manualLog }
        } catch (error) {
            dbLogger.error('createManualLog', error as Error, { contentLength: content.length })
            throw error
        }
    }

    static async updateManualLog(id: string, data: UpdateActivityLogRequest): Promise<{log: ActivityLogRow | null, manualLog?: any}> {
        const startTime = Date.now()
        logger.debug('Updating manual log entry', {
            activityLogId: id,
            updateData: data
        })

        try {
            const result: any = {}

            if (data.reviewed !== undefined) {
                logger.debug('Updating activity log reviewed status', {
                    activityLogId: id,
                    reviewed: data.reviewed
                })
                result.log = await ActivityLog.update(id, {
                    reviewed: data.reviewed,
                    reviewed_at: data.reviewed ? new Date() : undefined
                })
            }

            if (data.details?.content) {
                logger.debug('Updating manual log content', {
                    activityLogId: id,
                    contentLength: data.details.content.length
                })
                result.manualLog = await ManualLog.update(id, data.details.content)
            }

            if (!result.log) {
                logger.debug('Fetching updated activity log', { activityLogId: id })
                result.log = await ActivityLog.findById(id)
            }

            const duration = Date.now() - startTime
            logger.debug('Manual log update completed', {
                activityLogId: id,
                duration,
                updatedFields: Object.keys(data)
            })

            return result
        } catch (error) {
            dbLogger.error('updateManualLog', error as Error, { activityLogId: id, updateData: data })
            throw error
        }
    }

    static async deleteActivityLog(id: string): Promise<void> {
        const startTime = Date.now()
        logger.debug('Deleting activity log', { activityLogId: id })

        try {
            const log = await ActivityLog.findById(id)
            if (!log) {
                logger.debug('Activity log not found for deletion', { activityLogId: id })
                throw new Error('Activity log not found')
            }

            logger.debug('Found activity log for deletion', {
                activityLogId: id,
                logType: log.type
            })

            // Cascade DELETE is handled by database constraints
            await ActivityLog.delete(id)

            const duration = Date.now() - startTime
            logger.debug('Activity log deletion completed', {
                activityLogId: id,
                duration
            })
        } catch (error) {
            dbLogger.error('deleteActivityLog', error as Error, { activityLogId: id })
            throw error
        }
    }

    static async markLogsAsReviewed(ids: string[]): Promise<ActivityLogRow[]> {
        const startTime = Date.now()
        logger.debug('Marking logs as reviewed', {
            activityLogIds: ids,
            count: ids.length
        })

        try {
            const result = await ActivityLog.markAsReviewed(ids)

            const duration = Date.now() - startTime
            logger.debug('Logs marked as reviewed', {
                activityLogIds: ids,
                resultCount: result.length,
                duration
            })

            return result
        } catch (error) {
            dbLogger.error('markLogsAsReviewed', error as Error, { activityLogIds: ids })
            throw error
        }
    }
}