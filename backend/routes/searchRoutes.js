const express = require('express')
const { rateLimit } = require('express-rate-limit')
const { externalSearch } = require('../controllers/searchController')

const router = express.Router()
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many searches. Please wait a minute and try again.', results: [] },
})

router.get('/external', searchLimiter, externalSearch)

module.exports = router
