function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' })
  }

  console.error('API request failed:', error.message)
  return res.status(500).json({ error: 'The request could not be completed. Please try again.' })
}

module.exports = errorHandler
