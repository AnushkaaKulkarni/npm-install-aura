const express = require('express')
const progressController = require('../controllers/progressController')
const authenticate = require('../middlewares/authenticate')

const router = express.Router()

router.post('/:resourceId', authenticate, progressController.recordProgress)
router.get('/my', authenticate, progressController.getMyLearningProgress)
router.get('/:resourceId', authenticate, progressController.getProgressForResource)

module.exports = router
