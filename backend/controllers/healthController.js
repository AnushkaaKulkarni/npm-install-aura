const mongoose = require('mongoose')

function getHealth(req, res) {
  return res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
}

module.exports = { getHealth }
