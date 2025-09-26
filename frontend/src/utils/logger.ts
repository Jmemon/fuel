// Frontend logging utility
// Comprehensive debug logging for React application

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogContext {
    component?: string
    action?: string
    data?: any
    timestamp?: string
    sessionId?: string
    userAgent?: string
    logLevel?: string
    environment?: string
    url?: string
    baseURL?: string
}

export class FrontendLogger {
    private static instance: FrontendLogger
    private sessionId: string
    private logLevel: LogLevel
    private isProduction: boolean

    private constructor() {
        this.sessionId = this.generateSessionId()
        this.logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug'
        this.isProduction = import.meta.env.PROD

        // Initialize logging session
        this.info('Frontend logging initialized', {
            sessionId: this.sessionId,
            logLevel: this.logLevel,
            environment: this.isProduction ? 'production' : 'development',
            userAgent: navigator.userAgent,
            url: window.location.href
        })
    }

    public static getInstance(): FrontendLogger {
        if (!FrontendLogger.instance) {
            FrontendLogger.instance = new FrontendLogger()
        }
        return FrontendLogger.instance
    }

    private generateSessionId(): string {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['error', 'warn', 'info', 'debug']
        const currentLevelIndex = levels.indexOf(this.logLevel)
        const messageLevelIndex = levels.indexOf(level)
        return messageLevelIndex <= currentLevelIndex
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString()
        const sessionInfo = `[${this.sessionId}]`
        const componentInfo = context?.component ? `[${context.component}]` : ''
        const actionInfo = context?.action ? `{${context.action}}` : ''

        return `${timestamp} [${level.toUpperCase()}] ${sessionInfo} ${componentInfo} ${actionInfo} ${message}`
    }

    private log(level: LogLevel, message: string, context?: LogContext, ...args: any[]): void {
        if (!this.shouldLog(level)) return

        const formattedMessage = this.formatMessage(level, message, context)
        const logData = {
            timestamp: new Date().toISOString(),
            level,
            message,
            sessionId: this.sessionId,
            url: window.location.href,
            ...context
        }

        // Use appropriate console method with styling
        const styles = this.getLogStyles(level)

        switch (level) {
            case 'error':
                console.error(`%c${formattedMessage}`, styles, logData, ...args)
                break
            case 'warn':
                console.warn(`%c${formattedMessage}`, styles, logData, ...args)
                break
            case 'info':
                console.info(`%c${formattedMessage}`, styles, logData, ...args)
                break
            case 'debug':
                console.debug(`%c${formattedMessage}`, styles, logData, ...args)
                break
        }

        // Store in session storage for debugging (last 100 logs)
        this.storeLog(logData)
    }

    private getLogStyles(level: LogLevel): string {
        const baseStyle = 'font-family: monospace; font-size: 11px;'

        switch (level) {
            case 'error':
                return baseStyle + 'color: #ff4444; font-weight: bold;'
            case 'warn':
                return baseStyle + 'color: #ffaa00; font-weight: bold;'
            case 'info':
                return baseStyle + 'color: #0088ff;'
            case 'debug':
                return baseStyle + 'color: #888888;'
            default:
                return baseStyle
        }
    }

    private storeLog(logData: any): void {
        try {
            const storedLogs = JSON.parse(sessionStorage.getItem('fuel_debug_logs') || '[]')
            storedLogs.push(logData)

            // Keep only last 100 logs
            if (storedLogs.length > 100) {
                storedLogs.splice(0, storedLogs.length - 100)
            }

            sessionStorage.setItem('fuel_debug_logs', JSON.stringify(storedLogs))
        } catch (e) {
            console.warn('Failed to store log in session storage:', e)
        }
    }

    // Public logging methods
    public error(message: string, context?: LogContext, ...args: any[]): void {
        this.log('error', message, context, ...args)
    }

    public warn(message: string, context?: LogContext, ...args: any[]): void {
        this.log('warn', message, context, ...args)
    }

    public info(message: string, context?: LogContext, ...args: any[]): void {
        this.log('info', message, context, ...args)
    }

    public debug(message: string, context?: LogContext, ...args: any[]): void {
        this.log('debug', message, context, ...args)
    }

    // Specialized logging methods
    public component(componentName: string, action: string, data?: any): void {
        this.debug(`Component ${action}`, {
            component: componentName,
            action,
            data
        })
    }

    public apiCall(method: string, url: string, data?: any): void {
        this.info(`API ${method} ${url}`, {
            action: 'api_call',
            data: {
                method,
                url,
                requestData: data,
                timestamp: Date.now()
            }
        })
    }

    public apiResponse(method: string, url: string, status: number, duration: number, response?: any): void {
        const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info'
        this.log(level, `API ${method} ${url} - ${status} (${duration}ms)`, {
            action: 'api_response',
            data: {
                method,
                url,
                status,
                duration,
                response: response && typeof response === 'object' ?
                    JSON.stringify(response).substring(0, 200) : response
            }
        })
    }

    public userAction(action: string, element?: string, data?: any): void {
        this.info(`User ${action}`, {
            action: 'user_interaction',
            data: {
                action,
                element,
                data,
                url: window.location.href
            }
        })
    }

    public performance(label: string, startTime: number, metadata?: any): void {
        const duration = Date.now() - startTime
        this.debug(`Performance: ${label} took ${duration}ms`, {
            action: 'performance',
            data: {
                label,
                duration,
                metadata
            }
        })
    }

    public stateChange(storeName: string, action: string, previousState?: any, newState?: any): void {
        this.debug(`State change in ${storeName}`, {
            action: 'state_change',
            data: {
                store: storeName,
                action,
                previousState,
                newState
            }
        })
    }

    public error_boundary(error: Error, errorInfo?: any, component?: string): void {
        this.error(`Error boundary caught error in ${component || 'unknown component'}`, {
            component,
            action: 'error_boundary',
            data: {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                errorInfo
            }
        })
    }

    // Utility methods
    public getLogs(): any[] {
        try {
            return JSON.parse(sessionStorage.getItem('fuel_debug_logs') || '[]')
        } catch (e) {
            return []
        }
    }

    public clearLogs(): void {
        sessionStorage.removeItem('fuel_debug_logs')
        this.info('Debug logs cleared')
    }

    public downloadLogs(): void {
        const logs = this.getLogs()
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `fuel-debug-logs-${new Date().toISOString().slice(0, 19)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        this.info('Debug logs downloaded')
    }

    public getSessionId(): string {
        return this.sessionId
    }
}

// Create and export singleton instance
export const logger = FrontendLogger.getInstance()

// Component logging helper
export const useComponentLogger = (componentName: string) => {
    return {
        mount: (props?: any) => logger.component(componentName, 'mount', { props }),
        unmount: () => logger.component(componentName, 'unmount'),
        render: (props?: any) => logger.component(componentName, 'render', { props }),
        update: (prevProps?: any, newProps?: any) => logger.component(componentName, 'update', { prevProps, newProps }),
        action: (action: string, data?: any) => logger.component(componentName, action, data),
        error: (error: Error, context?: any) => logger.error(`Error in ${componentName}`, { component: componentName, data: { error: error.message, stack: error.stack, context } })
    }
}

// Export for global debugging
if (typeof window !== 'undefined') {
    (window as any).fuelLogger = logger
}