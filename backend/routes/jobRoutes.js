const express = require('express')
const jobController = require('../controllers/jobController')
const applicationController = require('../controllers/applicationController')
const authenticate = require('../middlewares/authenticate')

const router = express.Router()

router.get('/', jobController.listPublicJobs)
router.get('/applications', authenticate, (req, res, next) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Only employer accounts can review applications.' })
  return applicationController.listEmployerApplications(req, res, next)
})
router.patch('/applications/:applicationId', authenticate, (req, res, next) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Only employer accounts can update application status.' })
  return applicationController.updateEmployerApplicationStatus(req, res, next)
})
router.get('/mine', authenticate, (req, res, next) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Only employer accounts can access their job postings.' })
  return jobController.listEmployerJobs(req, res, next)
})
router.post('/', authenticate, (req, res, next) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Only employer accounts can post jobs.' })
  return jobController.createJob(req, res, next)
})

module.exports = router
