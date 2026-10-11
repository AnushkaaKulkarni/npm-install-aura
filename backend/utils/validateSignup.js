const roleValues = ['candidate', 'employer', 'provider']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[\d\s().-]{8,20}$/

function validateSignup(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.'
  }

  const { fullName, email, phone, password, role, profile } = body

  if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
    return 'Enter a name between 2 and 100 characters.'
  }
  if (typeof email !== 'string' || email.length > 254 || !emailPattern.test(email.trim())) {
    return 'Enter a valid email address.'
  }
  if (typeof phone !== 'string' || !phonePattern.test(phone.trim()) || phone.replace(/\D/g, '').length < 8) {
    return 'Enter a valid mobile number.'
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return 'Password must be at least 8 characters and no more than 72 bytes.'
  }
  if (!roleValues.includes(role)) return 'Select a valid stakeholder role.'
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return 'Complete the profile details for your role.'
  }

  if (role === 'candidate') {
    if (typeof profile.location !== 'string' || !profile.location.trim() || profile.location.trim().length > 120) {
      return 'Enter your current location.'
    }
    if (
      typeof profile.highestEducation !== 'string'
      || !profile.highestEducation.trim()
      || profile.highestEducation.trim().length > 120
    ) {
      return 'Enter your highest education.'
    }
  } else {
    const organizationFields = [
      ['organizationName', 'organization name', 160],
      ['designation', 'position', 100],
      ['website', 'organization website', 2048],
    ]

    for (const [field, label, maxLength] of organizationFields) {
      if (typeof profile[field] !== 'string' || !profile[field].trim() || profile[field].trim().length > maxLength) {
        return `Enter a valid ${label}.`
      }
    }

    try {
      const website = new URL(profile.website)
      if (!['http:', 'https:'].includes(website.protocol)) {
        return 'Enter an organization website beginning with http:// or https://.'
      }
    } catch {
      return 'Enter a valid organization website URL.'
    }
  }

  return null
}

module.exports = validateSignup
