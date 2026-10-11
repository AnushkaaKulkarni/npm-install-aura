const jwt = require('jsonwebtoken')

const cookieName = 'rozgarlink_session'
const expiry = process.env.JWT_EXPIRY || '7d'

function secondsFromExpiry(value) {
  const match = /^(\d+)(s|m|h|d|w|y)$/.exec(value)
  if (!match) return 7 * 24 * 60 * 60

  const units = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, y: 31536000 }
  return Number(match[1]) * units[match[2]]
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  }
}

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: expiry })
  res.cookie(cookieName, token, {
    ...sessionCookieOptions(),
    maxAge: secondsFromExpiry(expiry) * 1000,
  })
}

function clearSessionCookie(res) {
  res.clearCookie(cookieName, sessionCookieOptions())
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    verificationStatus: user.verificationStatus,
    profile: user.profile,
  }
}

module.exports = {
  cookieName,
  clearSessionCookie,
  serializeUser,
  setSessionCookie,
}
