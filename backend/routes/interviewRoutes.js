const express = require('express')
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose')
const interviewController = require('../controllers/interviewController')
const authenticate = require('../middlewares/authenticate')

const router = express.Router()
const interviewRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Interview practice is being used frequently. Please try again in a few minutes.' },
})

router.use(authenticate, (req, res, next) => {
  if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidate accounts can use interview practice.' })
  return next()
}, interviewRateLimit)
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'The interview session ID is invalid.' })
  return next()
})

router.get('/sessions/mine', interviewController.listSessions)
router.post('/sessions', interviewController.createSession)
router.get('/sessions/:id', interviewController.getSession)
router.post('/sessions/:id/transcribe', express.json({ limit: '8mb' }), interviewController.transcribeSessionAnswer)
router.post('/sessions/:id/answer', interviewController.submitSessionAnswer)
router.post('/sessions/:id/next', interviewController.nextSessionQuestion)
router.post('/sessions/:id/finish', interviewController.finishSession)
router.post('/question', interviewController.getQuestion)
router.post('/answer', interviewController.submitAnswer)

module.exports = router
