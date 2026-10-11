const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const authRoutes = require('./routes/authRoutes')
const healthRoutes = require('./routes/healthRoutes')
const jobRoutes = require('./routes/jobRoutes')
const assistantRoutes = require('./routes/assistantRoutes')
const errorHandler = require('./middlewares/errorHandler')
const notFoundHandler = require('./middlewares/notFoundHandler')
const { createCorsOptions } = require('./utils/corsOptions')

const app = express()

app.use(helmet())
app.use(cors(createCorsOptions()))
app.use(express.json({ limit: '16kb' }))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/assistant', assistantRoutes)
app.use('/health', healthRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
