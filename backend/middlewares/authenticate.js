const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { cookieName, clearSessionCookie } = require('../utils/auth')

async function authenticate(req, res, next) {
  const token = req.cookies[cookieName]
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'This account is no longer available.' })

    req.user = user
    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      clearSessionCookie(res)
      return res.status(401).json({ error: 'Your session has expired. Please log in again.' })
    }

    return next(error)
  }
}

module.exports = authenticate
