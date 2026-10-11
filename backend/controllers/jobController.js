const Job = require('../models/Job')
const User = require('../models/User')

const workModes = ['On-site', 'Hybrid', 'Remote']
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']

function parseLegacyRange(value) {
  if (typeof value !== 'string') return null
  const match = value.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)/i)
  if (!match) return null
  return [Number(match[1]), Number(match[2])]
}

function formatExperience(minYears, maxYears) {
  return `${minYears}–${maxYears} years`
}

function formatPackage(minLpa, maxLpa) {
  return `₹${minLpa}–${maxLpa} LPA`
}

function validateJob(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Job details must be a JSON object.'

  const requiredText = [
    ['title', 'job title', 120],
    ['department', 'department', 100],
    ['location', 'location', 160],
    ['description', 'role description', 5000],
  ]

  for (const [field, label, maxLength] of requiredText) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > maxLength) {
      return `Enter a valid ${label} (maximum ${maxLength} characters).`
    }
  }

  if (!workModes.includes(body.workMode)) return 'Select a valid work mode.'
  if (!employmentTypes.includes(body.employmentType)) return 'Select a valid employment type.'
  if (!Number.isInteger(body.minExperienceYears) || body.minExperienceYears < 0 || body.minExperienceYears > 60) {
    return 'Enter a minimum experience between 0 and 60 years.'
  }
  if (!Number.isInteger(body.maxExperienceYears) || body.maxExperienceYears < body.minExperienceYears || body.maxExperienceYears > 60) {
    return 'Enter a maximum experience that is at least the minimum and no more than 60 years.'
  }
  const hasSalaryRange = (body.minSalaryLpa !== null && body.minSalaryLpa !== undefined)
    || (body.maxSalaryLpa !== null && body.maxSalaryLpa !== undefined)
  if (hasSalaryRange) {
    if (
      typeof body.minSalaryLpa !== 'number'
      || !Number.isFinite(body.minSalaryLpa)
      || body.minSalaryLpa < 0
      || body.minSalaryLpa > 1000
      || typeof body.maxSalaryLpa !== 'number'
      || !Number.isFinite(body.maxSalaryLpa)
      || body.maxSalaryLpa < body.minSalaryLpa
      || body.maxSalaryLpa > 1000
    ) {
      return 'Enter a valid annual package range in LPA, with the maximum at least the minimum.'
    }
  }
  if (typeof body.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) return 'Enter a valid application deadline.'
  const deadline = new Date(`${body.deadline}T23:59:59.999Z`)
  if (!Number.isFinite(deadline.getTime()) || deadline <= new Date()) return 'Application deadline must be in the future.'

  if (!Array.isArray(body.requiredSkills) || body.requiredSkills.length === 0 || body.requiredSkills.length > 30) {
    return 'Add between 1 and 30 required skills.'
  }
  if (body.requiredSkills.some(skill => typeof skill !== 'string' || !skill.trim() || skill.trim().length > 60)) {
    return 'Each required skill must be between 1 and 60 characters.'
  }

  return null
}

function serializeJob(job, employer) {
  const legacyExperience = parseLegacyRange(job.experience)
  const legacyPackage = parseLegacyRange(job.salary)
  const minExperienceYears = job.minExperienceYears ?? legacyExperience?.[0] ?? null
  const maxExperienceYears = job.maxExperienceYears ?? legacyExperience?.[1] ?? null
  const minSalaryLpa = job.minSalaryLpa ?? legacyPackage?.[0] ?? null
  const maxSalaryLpa = job.maxSalaryLpa ?? legacyPackage?.[1] ?? null

  return {
    id: job._id.toString(),
    title: job.title,
    department: job.department,
    location: job.location,
    workMode: job.workMode,
    employmentType: job.employmentType,
    experience: minExperienceYears !== null && maxExperienceYears !== null
      ? formatExperience(minExperienceYears, maxExperienceYears)
      : job.experience || 'Not specified',
    salary: minSalaryLpa !== null && maxSalaryLpa !== null
      ? formatPackage(minSalaryLpa, maxSalaryLpa)
      : legacyPackage ? formatPackage(legacyPackage[0], legacyPackage[1]) : job.salary || 'Package not specified',
    minExperienceYears,
    maxExperienceYears,
    minSalaryLpa,
    maxSalaryLpa,
    deadline: job.deadline,
    description: job.description,
    requiredSkills: job.requiredSkills,
    status: job.status,
    createdAt: job.createdAt,
    employer: {
      name: employer?.profile?.organizationName || 'Company',
      website: employer?.profile?.website || '',
      industry: employer?.profile?.industry || '',
    },
  }
}

async function listPublicJobs(req, res, next) {
  try {
    const jobs = await Job.find({ status: 'active', deadline: { $gte: new Date() } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('employerId', 'profile.organizationName profile.website profile.industry')
    return res.json({ jobs: jobs.map(job => serializeJob(job, job.employerId)) })
  } catch (error) {
    return next(error)
  }
}

async function listEmployerJobs(req, res, next) {
  try {
    const [jobs, employer] = await Promise.all([
      Job.find({ employerId: req.user._id }).sort({ createdAt: -1 }).limit(100),
      User.findById(req.user._id).select('profile.organizationName profile.website profile.industry'),
    ])
    return res.json({ jobs: jobs.map(job => serializeJob(job, employer)) })
  } catch (error) {
    return next(error)
  }
}

async function createJob(req, res, next) {
  const validationError = validateJob(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  try {
    const job = await Job.create({
      employerId: req.user._id,
      title: req.body.title.trim(),
      department: req.body.department.trim(),
      location: req.body.location.trim(),
      workMode: req.body.workMode,
      employmentType: req.body.employmentType,
      experience: formatExperience(req.body.minExperienceYears, req.body.maxExperienceYears),
      salary: req.body.minSalaryLpa == null ? '' : formatPackage(req.body.minSalaryLpa, req.body.maxSalaryLpa),
      minExperienceYears: req.body.minExperienceYears,
      maxExperienceYears: req.body.maxExperienceYears,
      minSalaryLpa: req.body.minSalaryLpa,
      maxSalaryLpa: req.body.maxSalaryLpa,
      deadline: new Date(`${req.body.deadline}T23:59:59.999Z`),
      description: req.body.description.trim(),
      requiredSkills: [...new Set(req.body.requiredSkills.map(skill => skill.trim()))],
    })
    return res.status(201).json({ job: serializeJob(job, req.user) })
  } catch (error) {
    return next(error)
  }
}

module.exports = { createJob, listEmployerJobs, listPublicJobs, parseLegacyRange, serializeJob, validateJob }
