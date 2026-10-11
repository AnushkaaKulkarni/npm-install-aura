function createCorsOptions() {
  const configuredOrigin = process.env.FRONTEND_URL
    ? new URL(process.env.FRONTEND_URL).origin
    : 'http://localhost:3000'
  const allowedOrigins = new Set([configuredOrigin])

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:3000')
    allowedOrigins.add('http://127.0.0.1:3000')
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true)
      return callback(new Error('This origin is not allowed to access the API.'))
    },
    credentials: true,
  }
}

module.exports = { createCorsOptions }
