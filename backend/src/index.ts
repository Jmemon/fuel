import express from 'express'
import cors from 'cors'
import activityLogsRouter from './routes/activityLogs'
import { errorHandler } from './middleware/errorHandler'

export class Server {
    private app: express.Application

    constructor() {
        this.app = express()
        this.setupMiddleware()
        this.setupRoutes()
        this.setupErrorHandling()
    }

    private setupMiddleware(): void {
        this.app.use(express.json({ limit: '10mb' }))
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }))
    }

    private setupRoutes(): void {
        this.app.use('/api/v1/activity-logs', activityLogsRouter)

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() })
        })
    }

    private setupErrorHandling(): void {
        this.app.use(errorHandler)
    }

    public start(port: number): void {
        this.app.listen(port, () => {
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