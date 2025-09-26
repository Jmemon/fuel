import express from 'express'
import { ActivityLogService } from '../services/ActivityLogService'
import { validateCreateManualLog, validateUpdateActivityLog, validateSearchRequest, validateUUID } from '../middleware/validation'
import { ActivityLogSearchRequest } from '../types/api'

const router = express.Router()

// POST for searching logs (using body instead of query params)
router.post('/search', validateSearchRequest, async (req, res, next) => {
    try {
        const { filters }: ActivityLogSearchRequest = req.body
        req.logger.debug('Searching activity logs with filters', { filters })

        const logs = await ActivityLogService.getFilteredLogs(filters)

        req.logger.info('Activity logs search completed', {
            resultCount: logs.length,
            filters
        })

        res.json(logs)
    } catch (error) {
        req.logger.error('Failed to search activity logs', error as Error, { filters: req.body.filters })
        next(error)
    }
})

// Keep GET for simple listing (no filters)
router.get('/', async (req, res, next) => {
    try {
        req.logger.debug('Fetching all activity logs (no filters)')

        const logs = await ActivityLogService.getFilteredLogs()

        req.logger.info('Activity logs fetch completed', {
            resultCount: logs.length
        })

        res.json(logs)
    } catch (error) {
        req.logger.error('Failed to fetch activity logs', error as Error)
        next(error)
    }
})

router.post('/', validateCreateManualLog, async (req, res, next) => {
    try {
        const { details } = req.body
        req.logger.debug('Creating manual activity log entry', {
            content: details.content,
            contentLength: details.content?.length
        })

        const log = await ActivityLogService.createManualEntry(details.content)

        req.logger.info('Manual activity log entry created', {
            logId: log.id,
            content: details.content
        })

        res.status(201).json(log)
    } catch (error) {
        req.logger.error('Failed to create manual activity log entry', error as Error, {
            content: req.body.details?.content
        })
        next(error)
    }
})

router.put('/:id', validateUUID('id'), validateUpdateActivityLog, async (req, res, next) => {
    try {
        const { id } = req.params
        req.logger.debug('Updating activity log entry', {
            logId: id,
            updateData: req.body
        })

        const log = await ActivityLogService.updateEntry(id, req.body)

        req.logger.info('Activity log entry updated', {
            logId: id,
            updatedData: req.body
        })

        res.json(log)
    } catch (error) {
        req.logger.error('Failed to update activity log entry', error as Error, {
            logId: req.params.id,
            updateData: req.body
        })
        next(error)
    }
})

router.delete('/:id', validateUUID('id'), async (req, res, next) => {
    try {
        const { id } = req.params
        req.logger.debug('Deleting activity log entry', { logId: id })

        await ActivityLogService.deleteEntry(id)

        req.logger.info('Activity log entry deleted', { logId: id })

        res.status(204).send()
    } catch (error) {
        req.logger.error('Failed to delete activity log entry', error as Error, {
            logId: req.params.id
        })
        next(error)
    }
})

export default router