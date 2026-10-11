const express = require('express')
const skillController = require('../controllers/skillController')
const optionalAuthenticate = require('../middlewares/optionalAuthenticate')

const router = express.Router()

router.get('/', skillController.listSkills)
router.post('/suggest', optionalAuthenticate, skillController.suggestSkill)

module.exports = router
