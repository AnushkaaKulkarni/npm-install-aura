const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { cookieName } = require('../utils/auth')

async function optionalAuthenticate(req, res, next) {
  const token = req.cookies[cookieName]
  if (!token) return next()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (user) {
      req.user = user
    }
    return next()
  } catch {
    return next()
  }
}

module.exports = optionalAuthenticate
