import axios, { AxiosInstance, AxiosError } from 'axios'
import { ActivityLogResponse, ActivityLogFilters, CreateManualLogRequest, UpdateActivityLogRequest, ActivityLogSearchRequest } from '../types/api'

export class ApiService {
    private baseURL: string
    private client: AxiosInstance

    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('API Error:', error)
                return Promise.reject(this.handleError(error))
            }
        )
    }

    async getActivityLogs(filters?: ActivityLogFilters): Promise<ActivityLogResponse[]> {
        if (filters && Object.keys(filters).length > 0) {
            // Use POST /search for filtered requests
            const request: ActivityLogSearchRequest = { filters }
            const response = await this.client.post('/api/v1/activity-logs/search', request)
            return response.data
        } else {
            // Use GET for simple listing
            const response = await this.client.get('/api/v1/activity-logs')
            return response.data
        }
    }

    async createManualLog(content: string): Promise<ActivityLogResponse> {
        const request: CreateManualLogRequest = {
            details: { content }
        }
        const response = await this.client.post('/api/v1/activity-logs', request)
        return response.data
    }

    async updateActivityLog(id: string, data: UpdateActivityLogRequest): Promise<ActivityLogResponse> {
        const response = await this.client.put(`/api/v1/activity-logs/${id}`, data)
        return response.data
    }

    async deleteActivityLog(id: string): Promise<void> {
        await this.client.delete(`/api/v1/activity-logs/${id}`)
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