const express = require('express')
const candidateController = require('../controllers/candidateController')
const authenticate = require('../middlewares/authenticate')

const router = express.Router()

router.use(authenticate, (req, res, next) => {
  if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidate accounts can access this workspace.' })
  return next()
})

router.get('/dashboard', candidateController.getDashboard)
router.get('/profile', candidateController.getProfile)
router.get('/skill-gap-analysis/preview', candidateController.getSkillGapPreview)
router.get('/skill-gap-analysis', candidateController.getSkillGapAnalysis)
router.patch('/profile/:section', candidateController.updateProfileSection)
router.get('/applications', candidateController.listApplications)
router.post('/applications', candidateController.applyToJob)
router.get('/saved-jobs', candidateController.listSavedJobs)
router.put('/saved-jobs/:jobId', candidateController.saveJob)
router.delete('/saved-jobs/:jobId', candidateController.unsaveJob)

module.exports = router
