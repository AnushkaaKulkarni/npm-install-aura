const { createTutorLesson, supportedDurations, supportedLanguages } = require('../services/aiTutorService')

async function createSession(req, res, next) {
  const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : ''
  const language = typeof req.body?.language === 'string' ? req.body.language : ''
  const duration = Number(req.body?.duration)
  if (topic.length < 2 || topic.length > 160) return res.status(400).json({ error: 'Enter a topic between 2 and 160 characters.' })
  if (!supportedLanguages.includes(language)) return res.status(400).json({ error: 'Choose English, Hindi, or Marathi.' })
  if (!supportedDurations.includes(duration)) return res.status(400).json({ error: 'Choose a duration of 5, 10, 15, or 20 minutes.' })
  try {
    const lesson = await createTutorLesson({ topic, language, duration })
    return res.status(201).json({ lesson })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    return next(error)
  }
}

module.exports = { createSession }
