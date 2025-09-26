import { RequestLogger } from '../utils/logger'

declare global {
    namespace Express {
        interface Request {
            logger: RequestLogger
            requestId: string
        }
    }
}

export {}