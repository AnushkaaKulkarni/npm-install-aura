function notFoundHandler(req, res) {
  return res.status(404).json({ error: 'The requested API endpoint was not found.' })
}

module.exports = notFoundHandler
