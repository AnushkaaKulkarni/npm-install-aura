const express = require('express')
const resourceController = require('../controllers/resourceController')
const authenticate = require('../middlewares/authenticate')
const optionalAuthenticate = require('../middlewares/optionalAuthenticate')

const router = express.Router()

function requireProvider(req, res, next) {
  if (req.user.role !== 'provider') {
    return res.status(403).json({ error: 'Only training provider accounts can perform this action.' })
  }
  return next()
}

// Provider routes
router.get('/mine', authenticate, requireProvider, resourceController.listProviderResources)
router.get('/provider/stats', authenticate, requireProvider, resourceController.getProviderStats)
router.get('/provider/:id', authenticate, requireProvider, resourceController.getProviderResource)
router.post('/upload-document', authenticate, requireProvider, resourceController.uploadDocument)
router.post('/', authenticate, requireProvider, resourceController.createResource)
router.patch('/provider/:id', authenticate, requireProvider, resourceController.updateResource)
router.delete('/provider/:id', authenticate, requireProvider, resourceController.deleteResource)
router.post('/:id/duplicate', authenticate, requireProvider, resourceController.duplicateResource)

// Candidate and public routes
router.get('/recommendations', optionalAuthenticate, resourceController.getLearningRecommendations)
router.get('/', optionalAuthenticate, resourceController.listPublishedResources)
router.get('/:id', optionalAuthenticate, resourceController.getPublishedResource)

module.exports = router
