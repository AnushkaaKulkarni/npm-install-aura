const { serializeUser } = require('../utils/auth')

function validateProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Company profile must be a JSON object.'

  const fields = [
    ['organizationName', 'company name', 160, true],
    ['website', 'company website', 2048, false],
    ['industry', 'industry', 120, false],
    ['companySize', 'company size', 80, false],
    ['description', 'company description', 2000, false],
  ]

  for (const [field, label, maxLength, required] of fields) {
    const value = body[field]
    if (typeof value !== 'string' || value.trim().length > maxLength || (required && !value.trim())) {
      return `Enter a valid ${label} (maximum ${maxLength} characters).`
    }
  }

  if (body.website.trim()) {
    try {
      const website = new URL(body.website)
      if (!['http:', 'https:'].includes(website.protocol)) return 'Enter a company website beginning with http:// or https://.'
    } catch {
      return 'Enter a valid company website URL.'
    }
  }
  return null
}

async function updateCompanyProfile(req, res, next) {
  const validationError = validateProfile(req.body)
  if (validationError) return res.status(400).json({ error: validationError })
  try {
    req.user.profile.organizationName = req.body.organizationName.trim()
    req.user.profile.website = req.body.website.trim()
    req.user.profile.industry = req.body.industry.trim()
    req.user.profile.companySize = req.body.companySize.trim()
    req.user.profile.description = req.body.description.trim()
    await req.user.save()
    return res.json({ user: serializeUser(req.user) })
  } catch (error) {
    return next(error)
  }
}

module.exports = { updateCompanyProfile }
