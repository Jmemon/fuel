import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('Error:', error)

    if (error instanceof ZodError) {
        res.status(400).json({
            error: 'Validation failed',
            details: error.errors
        })
        return
    }

    if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message })
        return
    }

    if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message })
        return
    }

    res.status(500).json({ error: 'Internal server error' })
}

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