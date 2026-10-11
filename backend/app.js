const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const authRoutes = require('./routes/authRoutes')
const healthRoutes = require('./routes/healthRoutes')
const jobRoutes = require('./routes/jobRoutes')
const interviewRoutes = require('./routes/interviewRoutes')
const candidateRoutes = require('./routes/candidateRoutes')
const errorHandler = require('./middlewares/errorHandler')
const notFoundHandler = require('./middlewares/notFoundHandler')
const { createCorsOptions } = require('./utils/corsOptions')

const app = express()

app.use(helmet())
app.use(cors(createCorsOptions()))
app.use((req, res, next) => {
  if (/^\/api\/interviews\/sessions\/[^/]+\/transcribe$/.test(req.path)) return next()
  return express.json({ limit: '16kb' })(req, res, next)
})
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/candidate', candidateRoutes)
app.use('/health', healthRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
