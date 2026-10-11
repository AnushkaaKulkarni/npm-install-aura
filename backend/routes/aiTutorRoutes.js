const express = require('express')
const authenticate = require('../middlewares/authenticate')
const assistantRateLimiter = require('../middlewares/assistantRateLimiter')
const { createSession } = require('../controllers/aiTutorController')

const router = express.Router()
router.use(authenticate, assistantRateLimiter)
router.use((req, res, next) => {
  if (req.user.role !== 'candidate') return res.status(403).json({ error: 'AI Tutor is available in the candidate workspace.' })
  return next()
})
router.post('/sessions', createSession)

module.exports = router
