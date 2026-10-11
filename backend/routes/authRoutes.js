const express = require('express')
const authController = require('../controllers/authController')
const profileController = require('../controllers/profileController')
const authenticate = require('../middlewares/authenticate')
const authRateLimiter = require('../middlewares/authRateLimiter')

const router = express.Router()

router.post('/signup', authRateLimiter, authController.signup)
router.post('/login', authRateLimiter, authController.login)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.getCurrentUser)
router.patch('/company-profile', authenticate, profileController.updateCompanyProfile)

module.exports = router
