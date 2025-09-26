import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { ActivityLogResponse, ActivityLogFilters, CreateManualLogRequest, UpdateActivityLogRequest, ActivityLogSearchRequest } from '../types/api'
import { logger } from '../utils/logger'

// Extend Axios types to include metadata for timing
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number
        }
    }
}

export class ApiService {
    private baseURL: string
    private client: AxiosInstance

    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        logger.info('Initializing API service', { baseURL: this.baseURL })

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // Request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                const startTime = Date.now()
                // Store start time for duration calculation
                config.metadata = { startTime }

                logger.apiCall(
                    config.method?.toUpperCase() || 'UNKNOWN',
                    config.url || '',
                    {
                        headers: config.headers,
                        data: config.data,
                        params: config.params
                    }
                )

                return config
            },
            (error) => {
                logger.error('API request interceptor error', {
                    action: 'request_interceptor_error',
                    data: { error: error.message }
                })
                return Promise.reject(error)
            }
        )

        // Response interceptor for logging
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                const duration = Date.now() - (response.config.metadata?.startTime || Date.now())

                logger.apiResponse(
                    response.config.method?.toUpperCase() || 'UNKNOWN',
                    response.config.url || '',
                    response.status,
                    duration,
                    {
                        headers: response.headers,
                        data: response.data,
                        dataSize: JSON.stringify(response.data).length
                    }
                )

                return response
            },
            (error: AxiosError) => {
                const duration = Date.now() - (error.config?.metadata?.startTime || Date.now())

                logger.apiResponse(
                    error.config?.method?.toUpperCase() || 'UNKNOWN',
                    error.config?.url || '',
                    error.response?.status || 0,
                    duration,
                    {
                        error: error.message,
                        response: error.response?.data
                    }
                )

                logger.error('API Error', {
                    action: 'api_error',
                    data: {
                        method: error.config?.method,
                        url: error.config?.url,
                        status: error.response?.status,
                        message: error.message,
                        response: error.response?.data
                    }
                })

                return Promise.reject(this.handleError(error))
            }
        )

        logger.info('API service initialized successfully')
    }

    async getActivityLogs(filters?: ActivityLogFilters): Promise<ActivityLogResponse[]> {
        logger.debug('Getting activity logs', {
            action: 'get_activity_logs',
            data: { filters, hasFilters: filters && Object.keys(filters).length > 0 }
        })

        try {
            if (filters && Object.keys(filters).length > 0) {
                // Use POST /search for filtered requests
                const request: ActivityLogSearchRequest = { filters }
                logger.debug('Using POST /search for filtered request', {
                    data: { filters }
                })

                const response = await this.client.post('/api/v1/activity-logs/search', request)

                logger.info('Activity logs retrieved with filters', {
                    data: {
                        resultCount: response.data.length,
                        filters
                    }
                })

                return response.data
            } else {
                // Use GET for simple listing
                logger.debug('Using GET for simple listing')

                const response = await this.client.get('/api/v1/activity-logs')

                logger.info('Activity logs retrieved (no filters)', {
                    data: { resultCount: response.data.length }
                })

                return response.data
            }
        } catch (error) {
            logger.error('Failed to get activity logs', {
                data: { filters, error: error instanceof Error ? error.message : error }
            })
            throw error
        }
    }

    async createManualLog(content: string): Promise<ActivityLogResponse> {
        logger.debug('Creating manual log', {
            action: 'create_manual_log',
            data: { contentLength: content.length }
        })

        try {
            const request: CreateManualLogRequest = {
                details: { content }
            }

            const response = await this.client.post('/api/v1/activity-logs', request)

            logger.info('Manual log created successfully', {
                data: {
                    logId: response.data.id,
                    contentLength: content.length
                }
            })

            return response.data
        } catch (error) {
            logger.error('Failed to create manual log', {
                data: { contentLength: content.length, error: error instanceof Error ? error.message : error }
            })
            throw error
        }
    }

    async updateActivityLog(id: string, data: UpdateActivityLogRequest): Promise<ActivityLogResponse> {
        logger.debug('Updating activity log', {
            action: 'update_activity_log',
            data: { logId: id, updateData: data }
        })

        try {
            const response = await this.client.put(`/api/v1/activity-logs/${id}`, data)

            logger.info('Activity log updated successfully', {
                data: {
                    logId: id,
                    updateData: data,
                    resultId: response.data.id
                }
            })

            return response.data
        } catch (error) {
            logger.error('Failed to update activity log', {
                data: { logId: id, updateData: data, error: error instanceof Error ? error.message : error }
            })
            throw error
        }
    }

    async deleteActivityLog(id: string): Promise<void> {
        logger.debug('Deleting activity log', {
            action: 'delete_activity_log',
            data: { logId: id }
        })

        try {
            await this.client.delete(`/api/v1/activity-logs/${id}`)

            logger.info('Activity log deleted successfully', {
                data: { logId: id }
            })
        } catch (error) {
            logger.error('Failed to delete activity log', {
                data: { logId: id, error: error instanceof Error ? error.message : error }
            })
            throw error
        }
    }

    private handleError(error: AxiosError): Error {
        if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
            return new Error((error.response.data as any).error)
        }

        if (error.response?.status === 404) {
            return new Error('Resource not found')
        }

        if (error.response && error.response.status >= 500) {
            return new Error('Server error occurred')
        }

        return new Error('Network error occurred')
    }
}

export const apiService = new ApiService()