const express = require('express')
const authenticate = require('../middlewares/authenticate')
const assistantRateLimiter = require('../middlewares/assistantRateLimiter')
const { createConversation, deleteConversation, getConversation, getProfile, listConversations, sendMessage, updateProfile } = require('../controllers/assistantController')

const router = express.Router()
router.use(authenticate)
router.use(assistantRateLimiter)
router.use((req, res, next) => {
  if (req.user.role !== 'candidate') return res.status(403).json({ error: 'The career assistant is available in the candidate workspace.' })
  return next()
})
router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.get('/conversations', listConversations)
router.post('/conversations', createConversation)
router.get('/conversations/:id', getConversation)
router.delete('/conversations/:id', deleteConversation)
router.post('/conversations/:id/messages', sendMessage)
router.post('/messages', sendMessage)

module.exports = router
