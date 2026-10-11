const rateLimit = require('express-rate-limit')

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'You have reached the assistant message limit. Please try again later.' },
})
