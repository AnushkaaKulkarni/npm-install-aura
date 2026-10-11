const bcrypt = require('bcryptjs')
const User = require('../models/User')
const validateSignup = require('../utils/validateSignup')
const { clearSessionCookie, serializeUser, setSessionCookie } = require('../utils/auth')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function signup(req, res, next) {
  const validationError = validateSignup(req.body || {})
  if (validationError) return res.status(400).json({ error: validationError })

  try {
    const email = req.body.email.trim().toLowerCase()
    const existing = await User.exists({ email })
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' })

    const profile = req.body.role === 'candidate'
      ? {
          location: req.body.profile.location.trim(),
          highestEducation: req.body.profile.highestEducation.trim(),
        }
      : {
          organizationName: req.body.profile.organizationName.trim(),
          designation: req.body.profile.designation.trim(),
          website: req.body.profile.website.trim(),
        }

    const user = await User.create({
      fullName: req.body.fullName.trim(),
      email,
      phone: req.body.phone.trim(),
      passwordHash: await bcrypt.hash(req.body.password, 12),
      role: req.body.role,
      verificationStatus: 'pending',
      profile,
    })

    setSessionCookie(res, user)
    return res.status(201).json({
      message: 'Account created. Verification is pending.',
      user: serializeUser(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    return next(error)
  }
}

async function login(req, res, next) {
  const body = req.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!emailPattern.test(email) || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Enter a valid email address and password.' })
  }

  try {
    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' })
    }

    setSessionCookie(res, user)
    return res.json({
      message: 'Logged in successfully.',
      user: serializeUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

function logout(req, res) {
  clearSessionCookie(res)
  return res.json({ message: 'Logged out successfully.' })
}

function getCurrentUser(req, res) {
  return res.json({ user: serializeUser(req.user) })
}

module.exports = {
  getCurrentUser,
  login,
  logout,
  signup,
}
