import express from 'express'
import { ActivityLogService } from '../services/ActivityLogService'
import { validateCreateManualLog, validateUpdateActivityLog, validateSearchRequest, validateUUID } from '../middleware/validation'
import { ActivityLogSearchRequest } from '../types/api'

const router = express.Router()

// POST for searching logs (using body instead of query params)
router.post('/search', validateSearchRequest, async (req, res, next) => {
    try {
        const { filters }: ActivityLogSearchRequest = req.body
        const logs = await ActivityLogService.getFilteredLogs(filters)
        res.json(logs)
    } catch (error) {
        next(error)
    }
})

// Keep GET for simple listing (no filters)
router.get('/', async (req, res, next) => {
    try {
        const logs = await ActivityLogService.getFilteredLogs()
        res.json(logs)
    } catch (error) {
        next(error)
    }
})

router.post('/', validateCreateManualLog, async (req, res, next) => {
    try {
        const { details } = req.body
        const log = await ActivityLogService.createManualEntry(details.content)
        res.status(201).json(log)
    } catch (error) {
        next(error)
    }
})

router.put('/:id', validateUUID('id'), validateUpdateActivityLog, async (req, res, next) => {
    try {
        const { id } = req.params
        const log = await ActivityLogService.updateEntry(id, req.body)
        res.json(log)
    } catch (error) {
        next(error)
    }
})

router.delete('/:id', validateUUID('id'), async (req, res, next) => {
    try {
        const { id } = req.params
        await ActivityLogService.deleteEntry(id)
        res.status(204).send()
    } catch (error) {
        next(error)
    }
})

export default router