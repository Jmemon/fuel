import express from 'express'
import logger from '../utils/logger'

const router = express.Router()

interface FrontendLogEntry {
    level: 'error' | 'warn' | 'info' | 'debug'
    message: string
    timestamp: string
    sessionId: string
    context?: {
        component?: string
        action?: string
        data?: any
        url?: string
        userAgent?: string
        [key: string]: any
    }
}

// POST endpoint to receive frontend logs
router.post('/', async (req, res, next) => {
    try {
        const logs: FrontendLogEntry[] = Array.isArray(req.body) ? req.body : [req.body]

        for (const logEntry of logs) {
            const { level, message, timestamp, sessionId, context } = logEntry

            // Format the frontend log with clear prefix
            const frontendMessage = `[FRONTEND] ${message}`

            // Add frontend-specific metadata
            const frontendContext = {
                frontendTimestamp: timestamp,
                frontendSessionId: sessionId,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                ...context
            }

            // Log to backend with appropriate level and FRONTEND prefix
            switch (level) {
                case 'error':
                    logger.error(frontendMessage, frontendContext)
                    break
                case 'warn':
                    logger.warn(frontendMessage, frontendContext)
                    break
                case 'info':
                    logger.info(frontendMessage, frontendContext)
                    break
                case 'debug':
                    logger.debug(frontendMessage, frontendContext)
                    break
                default:
                    logger.info(frontendMessage, frontendContext)
            }
        }

        req.logger?.debug('Received frontend logs', {
            logCount: logs.length,
            sessionIds: logs.map(log => log.sessionId)
        })

        res.status(200).json({ received: logs.length })
    } catch (error) {
        req.logger?.error('Failed to process frontend logs', error as Error, {
            bodyType: typeof req.body,
            bodyLength: JSON.stringify(req.body).length
        })
        next(error)
    }
})

export default router