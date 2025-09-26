import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { v4 as uuidv4 } from 'uuid'

const logLevel = process.env.LOG_LEVEL || 'debug'
const logToFile = process.env.LOG_TO_FILE === 'true'
const logDir = process.env.LOG_DIR || './logs'

// Custom format for better readability
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        const reqId = requestId ? `[${requestId}] ` : ''
        return `${timestamp} [${level.toUpperCase()}] ${reqId}${message}${metaStr ? '\n' + metaStr : ''}`
    })
)

// Console format for Docker logs
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss.SSS'
    }),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        const reqId = requestId ? `[${requestId}] ` : ''
        return `${timestamp} ${level} ${reqId}${message}${metaStr ? '\n' + metaStr : ''}`
    })
)

// Create transports array
const transports: winston.transport[] = [
    // Console transport for Docker logs
    new winston.transports.Console({
        level: logLevel,
        format: consoleFormat
    })
]

// Add file transports if enabled
if (logToFile) {
    // Error log file
    transports.push(
        new DailyRotateFile({
            filename: `${logDir}/error-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            format: customFormat,
            maxSize: '20m',
            maxFiles: '14d'
        })
    )

    // Combined log file
    transports.push(
        new DailyRotateFile({
            filename: `${logDir}/combined-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            format: customFormat,
            maxSize: '20m',
            maxFiles: '14d'
        })
    )
}

// Create the logger
const logger = winston.createLogger({
    level: logLevel,
    transports,
    exceptionHandlers: [
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
    rejectionHandlers: [
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
})

// Request correlation utilities
export const generateRequestId = (): string => {
    return uuidv4().slice(0, 8)
}

// Enhanced logger with request context
export class RequestLogger {
    private requestId: string
    private startTime: number

    constructor(requestId?: string) {
        this.requestId = requestId || generateRequestId()
        this.startTime = Date.now()
    }

    info(message: string, meta?: any) {
        logger.info(message, { requestId: this.requestId, ...meta })
    }

    error(message: string, error?: Error, meta?: any) {
        logger.error(message, {
            requestId: this.requestId,
            error: error?.message,
            stack: error?.stack,
            ...meta
        })
    }

    warn(message: string, meta?: any) {
        logger.warn(message, { requestId: this.requestId, ...meta })
    }

    debug(message: string, meta?: any) {
        logger.debug(message, { requestId: this.requestId, ...meta })
    }

    http(method: string, url: string, statusCode?: number, meta?: any) {
        const duration = Date.now() - this.startTime
        logger.info(`HTTP ${method} ${url}`, {
            requestId: this.requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            ...meta
        })
    }

    getRequestId(): string {
        return this.requestId
    }

    getDuration(): number {
        return Date.now() - this.startTime
    }
}

// Express middleware for request logging
export const requestLoggingMiddleware = (req: any, res: any, next: any) => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    // Attach logger to request
    req.logger = new RequestLogger(requestId)
    req.requestId = requestId

    // Log incoming request
    req.logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    })

    // Log response
    const originalSend = res.send
    res.send = function(body: any) {
        const duration = Date.now() - startTime
        req.logger.info('Outgoing response', {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: body ? body.length || JSON.stringify(body).length : 0
        })
        return originalSend.call(this, body)
    }

    next()
}

// Database operation logger
export const dbLogger = {
    query: (sql: string, params?: any[], duration?: number) => {
        logger.debug('Database query', {
            sql,
            params,
            duration: duration ? `${duration}ms` : undefined
        })
    },

    connection: (action: string, details?: any) => {
        logger.info(`Database ${action}`, details)
    },

    error: (operation: string, error: Error, context?: any) => {
        logger.error(`Database error in ${operation}`, {
            error: error.message,
            stack: error.stack,
            ...context
        })
    }
}

// Service logger for general application logging
export const serviceLogger = {
    startup: (service: string, port?: number) => {
        logger.info(`${service} starting up`, { port })
    },

    shutdown: (service: string) => {
        logger.info(`${service} shutting down`)
    },

    healthCheck: (service: string, status: 'healthy' | 'unhealthy', details?: any) => {
        const level = status === 'healthy' ? 'info' : 'error'
        logger.log(level, `Health check: ${service} is ${status}`, details)
    },

    error: (service: string, error: Error, context?: any) => {
        logger.error(`${service} error`, {
            error: error.message,
            stack: error.stack,
            ...context
        })
    }
}

export default logger