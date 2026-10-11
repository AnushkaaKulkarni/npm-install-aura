const path = require('node:path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const connectDatabase = require('./config/database')
const app = require('./app')

const port = Number(process.env.PORT || 5000)

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.')
  }

  await connectDatabase()

  return app.listen(port, () => {
    console.log(`RozgarLink API listening on port ${port}`)
  })
}

startServer().catch(error => {
  console.error('Unable to start RozgarLink API:', error.message)
  process.exitCode = 1
})
