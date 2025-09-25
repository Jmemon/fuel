import { DatabaseService } from './DatabaseService'
import {
    ActivityLogFilters,
    ActivityLogResponse,
    UpdateActivityLogRequest,
    ManualLogDetailsSchema,
    UUIDSchema,
    ActivityLogFiltersSchema
} from '../types/api'
import { ActivityLogRow } from '../models'
import { z } from 'zod'

export class ValidationError extends Error {
    constructor(message: string, public statusCode: number = 400) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'NotFoundError'
    }
}

export class ActivityLogService {
    static async getFilteredLogs(filters?: ActivityLogFilters): Promise<ActivityLogResponse[]> {
        // Validate filters if provided
        if (filters) {
            ActivityLogFiltersSchema.parse(filters)
        }

        const results = await DatabaseService.getActivityLogs(filters)
        return results.map(result => this.formatLogResponse(result.log, result.manualLog))
    }

    static async getUnreviewedLogs(): Promise<ActivityLogResponse[]> {
        const filters: ActivityLogFilters = { reviewed: false }
        const logs = await this.getFilteredLogs(filters)

        // Mark as reviewed after viewing
        if (logs.length > 0) {
            const ids = logs.map(log => log.id)
            await DatabaseService.markLogsAsReviewed(ids)
        }

        return logs
    }

    static async createManualEntry(content: string): Promise<ActivityLogResponse> {
        // Validate content using Zod
        const validation = ManualLogDetailsSchema.safeParse({ content })
        if (!validation.success) {
            throw new ValidationError(validation.error.errors[0].message)
        }

        const result = await DatabaseService.createManualLog(content)
        return this.formatLogResponse(result.log, result.manualLog)
    }

    static async updateEntry(id: string, data: UpdateActivityLogRequest): Promise<ActivityLogResponse> {
        // Validate UUID
        const idValidation = UUIDSchema.safeParse(id)
        if (!idValidation.success) {
            throw new ValidationError('Invalid UUID format')
        }

        await this.validateEntryExists(id)

        // Validate content if provided
        if (data.details?.content) {
            const validation = ManualLogDetailsSchema.safeParse(data.details)
            if (!validation.success) {
                throw new ValidationError(validation.error.errors[0].message)
            }
        }

        const result = await DatabaseService.updateManualLog(id, data)
        if (!result.log) {
            throw new NotFoundError('Activity log not found after update')
        }

        return this.formatLogResponse(result.log, result.manualLog)
    }

    static async deleteEntry(id: string): Promise<void> {
        // Validate UUID
        const idValidation = UUIDSchema.safeParse(id)
        if (!idValidation.success) {
            throw new ValidationError('Invalid UUID format')
        }

        await this.validateEntryExists(id)
        await DatabaseService.deleteActivityLog(id)
    }

    private static formatLogResponse(log: ActivityLogRow, details?: any): ActivityLogResponse {
        const response: ActivityLogResponse = {
            id: log.id,
            type: log.type,
            reviewed: log.reviewed,
            created_at: log.created_at.toISOString(),
            reviewed_at: log.reviewed_at?.toISOString() || null,
            details: { content: '' } // Default for manual logs
        }

        if (log.type === 'manual' && details) {
            response.details = { content: details.content }
        }

        return response
    }

    private static async validateEntryExists(id: string): Promise<void> {
        const result = await DatabaseService.getActivityLogs()
        const log = result.find(r => r.log.id === id)

        if (!log) {
            throw new NotFoundError('Activity log not found')
        }

        if (log.log.type !== 'manual') {
            throw new ValidationError('Can only modify manual log entries')
        }
    }
}