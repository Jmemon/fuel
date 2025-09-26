import express from 'express'
import cors from 'cors'
import activityLogsRouter from './routes/activityLogs'
import frontendLogsRouter from './routes/frontendLogs'
import { errorHandler } from './middleware/errorHandler'
import { requestLoggingMiddleware, serviceLogger } from './utils/logger'

export class Server {
    private app: express.Application

    constructor() {
        this.app = express()
        this.setupMiddleware()
        this.setupRoutes()
        this.setupErrorHandling()
    }

    private setupMiddleware(): void {
        // Request logging middleware (first to capture all requests)
        this.app.use(requestLoggingMiddleware)

        this.app.use(express.json({ limit: '10mb' }))
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }))

        serviceLogger.startup('Middleware setup completed')
    }

    private setupRoutes(): void {
        this.app.use('/api/v1/activity-logs', activityLogsRouter)
        this.app.use('/api/v1/frontend-logs', frontendLogsRouter)

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            const healthData = { status: 'ok', timestamp: new Date().toISOString() }
            serviceLogger.healthCheck('Backend API', 'healthy', healthData)
            res.json(healthData)
        })
    }

    private setupErrorHandling(): void {
        this.app.use(errorHandler)
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            serviceLogger.startup('Fuel Backend Server', port)
            console.log(`Server running on port ${port}`)
        })
    }

    public getApp(): express.Application {
        return this.app
    }
}

const server = new Server()
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
server.start(port)