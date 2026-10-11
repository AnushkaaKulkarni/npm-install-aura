function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' })
  }
  if (error.status === 413) {
    return res.status(413).json({ error: 'The recording exceeds the upload limit. Type your answer instead.' })
  }

  if (Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600) {
    if (error.statusCode >= 500) console.error('API request failed:', error.message)
    return res.status(error.statusCode).json({ error: error.message })
  }

  console.error('API request failed:', error.message)
  return res.status(500).json({ error: 'The request could not be completed. Please try again.' })
}

module.exports = errorHandler
