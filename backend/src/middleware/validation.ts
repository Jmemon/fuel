import { Request, Response, NextFunction } from 'express'
import {
    CreateManualLogRequestSchema,
    UpdateActivityLogRequestSchema,
    ActivityLogSearchRequestSchema,
    UUIDSchema
} from '../types/api'

export function validateCreateManualLog(req: Request, res: Response, next: NextFunction): void {
    const validation = CreateManualLogRequestSchema.safeParse(req.body)

    if (!validation.success) {
        res.status(400).json({
            error: 'Validation failed',
            details: validation.error.errors
        })
        return
    }

    next()
}

export function validateUpdateActivityLog(req: Request, res: Response, next: NextFunction): void {
    const validation = UpdateActivityLogRequestSchema.safeParse(req.body)

    if (!validation.success) {
        res.status(400).json({
            error: 'Validation failed',
            details: validation.error.errors
        })
        return
    }

    next()
}

export function validateSearchRequest(req: Request, res: Response, next: NextFunction): void {
    const validation = ActivityLogSearchRequestSchema.safeParse(req.body)

    if (!validation.success) {
        res.status(400).json({
            error: 'Validation failed',
            details: validation.error.errors
        })
        return
    }

    next()
}

export function validateUUID(paramName: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const param = req.params[paramName]
        const validation = UUIDSchema.safeParse(param)

        if (!validation.success) {
            res.status(400).json({
                error: `${paramName} must be a valid UUID`,
                details: validation.error.errors
            })
            return
        }

        next()
    }
}