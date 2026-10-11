const mongoose = require('mongoose')
const Application = require('../models/Application')
const Job = require('../models/Job')
const User = require('../models/User')
const { jobs: previewJobs, profile: previewProfile } = require('../services/candidateAnalysisPreview')
const {
  buildCandidateSkillAnalysis,
  candidateExperience,
  isFresher,
  normalizeSkill,
} = require('../services/candidateSkillAnalysis')
const { serializeJob } = require('./jobController')

const arrayLimits = {
  desiredJobTitles: 20,
  preferredIndustries: 30,
  preferredEmploymentTypes: 4,
  preferredWorkModes: 3,
  preferredLocations: 30,
  preferredCompanyTypes: 20,
  preferredJobCategories: 20,
  preferredShifts: 10,
  industryExperience: 20,
}
const recordLimits = {
  education: 15,
  experience: 30,
  skills: 100,
  projects: 30,
  certifications: 30,
  achievements: 30,
  languages: 20,
}
const allowedSections = new Set([
  'personal', 'contact', 'preferences', 'summary', 'education', 'experience',
  'skills', 'projects', 'certifications', 'achievements', 'languages', 'resume',
])
const sectionFields = {
  personal: ['headline', 'preferredDisplayName', 'dateOfBirth', 'gender', 'city', 'state', 'country', 'postalCode'],
  contact: ['alternatePhone', 'linkedinUrl', 'githubUrl', 'portfolioUrl'],
  preferences: ['desiredJobTitles', 'preferredIndustries', 'preferredEmploymentTypes', 'preferredWorkModes', 'preferredLocations', 'willingToRelocate', 'expectedSalaryMin', 'expectedSalaryMax', 'currentSalary', 'availability', 'careerLevel', 'preferredCompanyTypes', 'preferredJobCategories', 'preferredShifts'],
  summary: ['about', 'careerObjective', 'experienceYears', 'employmentStatus', 'currentJobTitle', 'currentCompany', 'industryExperience'],
  education: ['education'],
  experience: ['experience'],
  skills: ['skills'],
  projects: ['projects'],
  certifications: ['certifications'],
  achievements: ['achievements'],
  languages: ['languages'],
  resume: ['resume'],
}
const allowedEmploymentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']
const allowedWorkModes = ['On-site', 'Hybrid', 'Remote']

function validateUrl(value, label) {
  if (!value) return null
  if (typeof value !== 'string' || value.length > 2048) return `${label} must be a valid URL.`
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return `${label} must start with http:// or https://.`
  } catch {
    return `${label} must be a valid URL.`
  }
  return null
}

function validateArrayOfStrings(value, field, maximum) {
  if (!Array.isArray(value) || value.length > maximum) return `${field} must contain no more than ${maximum} entries.`
  if (value.some(item => typeof item !== 'string' || !item.trim() || item.trim().length > 120)) return `${field} entries must be non-empty text of at most 120 characters.`
  return null
}

function validateRecords(value, field, maximum) {
  if (!Array.isArray(value) || value.length > maximum) return `${field} must contain no more than ${maximum} records.`
  if (value.some(item => !item || typeof item !== 'object' || Array.isArray(item))) return `${field} must contain valid records.`
  return null
}

function validateSection(section, data) {
  if (!allowedSections.has(section)) return 'Choose a valid profile section.'
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Profile section data must be an object.'

  const allowed = new Set(sectionFields[section])
  if (Object.keys(data).some(key => !allowed.has(key))) return 'The profile update contains unsupported fields.'
  for (const [key, value] of Object.entries(data)) {
    if (arrayLimits[key]) {
      const error = validateArrayOfStrings(value, key, arrayLimits[key])
      if (error) return error
    }
    if (recordLimits[key]) {
      const error = validateRecords(value, key, recordLimits[key])
      if (error) return error
    }
  }

  for (const key of ['linkedinUrl', 'githubUrl', 'portfolioUrl']) {
    if (Object.hasOwn(data, key)) {
      const error = validateUrl(data[key], key)
      if (error) return error
    }
  }
  if (section === 'projects' && Array.isArray(data.projects)) {
    for (const project of data.projects) {
      for (const key of ['githubUrl', 'demoUrl']) {
        const error = validateUrl(project[key], key)
        if (error) return error
      }
    }
  }
  if (section === 'certifications' && Array.isArray(data.certifications)) {
    for (const certification of data.certifications) {
      const error = validateUrl(certification.credentialUrl, 'credential URL')
      if (error) return error
    }
  }
  if (section === 'achievements' && Array.isArray(data.achievements)) {
    for (const achievement of data.achievements) {
      const error = validateUrl(achievement.url, 'achievement URL')
      if (error) return error
    }
  }
  if (Object.hasOwn(data, 'willingToRelocate') && typeof data.willingToRelocate !== 'boolean') return 'Willingness to relocate must be true or false.'
  for (const key of ['expectedSalaryMin', 'expectedSalaryMax', 'currentSalary', 'experienceYears']) {
    if (!Object.hasOwn(data, key) || data[key] == null || data[key] === '') continue
    const maximum = key === 'experienceYears' ? 60 : 100000000
    if (typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] < 0 || data[key] > maximum) return `${key} must be a valid non-negative number.`
  }
  if (data.expectedSalaryMin != null && data.expectedSalaryMax != null && data.expectedSalaryMax < data.expectedSalaryMin) return 'Expected salary maximum must not be below the minimum.'
  if (data.resume != null) {
    if (typeof data.resume !== 'object' || Array.isArray(data.resume)) return 'Resume metadata must be an object.'
    const keys = Object.keys(data.resume)
    if (keys.some(key => !['fileName', 'url', 'uploadedAt', 'active'].includes(key))) return 'Resume metadata contains unsupported fields.'
    if (data.resume.fileName != null && (typeof data.resume.fileName !== 'string' || data.resume.fileName.length > 255)) return 'Resume filename must be at most 255 characters.'
    const urlError = validateUrl(data.resume.url, 'Resume URL')
    if (urlError) return urlError
  }
  return null
}

function profileCompletion(user) {
  const profile = user.profile?.candidate || {}
  const checks = [
    Boolean(user.fullName && user.email && user.phone && (profile.city || user.profile?.location)),
    Boolean(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl || profile.alternatePhone),
    Boolean(profile.desiredJobTitles?.length || profile.preferredLocations?.length || profile.preferredEmploymentTypes?.length),
    Boolean(profile.about || profile.careerObjective),
    Boolean(profile.education?.some(item => item.degree && item.institution) || user.profile?.highestEducation),
    Boolean(profile.experience?.some(item => item.title && item.company) || isFresher(profile)),
    Boolean(profile.skills?.length),
    Boolean(profile.projects?.some(item => item.title && item.description)),
    Boolean(profile.certifications?.some(item => item.name && item.issuer)),
    Boolean(profile.achievements?.some(item => item.title)),
    Boolean(profile.languages?.length),
    Boolean(profile.resume?.fileName && profile.resume?.url),
  ]
  return Math.round(checks.filter(Boolean).length / checks.length * 100)
}

function isEligible(job, experienceYears) {
  if (experienceYears === null && (job.minExperienceYears != null || job.maxExperienceYears != null)) return false
  if (job.minExperienceYears != null && (experienceYears === null || experienceYears < job.minExperienceYears)) return false
  if (job.maxExperienceYears != null && (experienceYears === null || experienceYears > job.maxExperienceYears)) return false
  return true
}

function matchScore(job, skills) {
  if (!job.requiredSkills?.length || !skills.size) return null
  const required = [...new Set(job.requiredSkills.map(normalizeSkill))]
  const matched = required.filter(skill => skills.has(skill)).length
  return Math.round(matched / required.length * 100)
}

function serializeApplication(application) {
  return {
    id: application._id.toString(),
    status: application.status,
    coverNote: application.coverNote,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    job: application.job ? serializeJob(application.job, application.job.employerId) : null,
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+profile.candidate.currentSalary')
    if (!user) return res.status(404).json({ error: 'Candidate account could not be found.' })
    const candidate = user.profile.candidate
    return res.json({ profile: serializeProfile(user) })
  } catch (error) {
    return next(error)
  }
}

function serializeProfile(user) {
  return {
    account: { fullName: user.fullName, email: user.email, phone: user.phone },
    candidate: user.profile.candidate.toObject({ getters: false }),
    completion: profileCompletion(user),
  }
}

async function updateProfileSection(req, res, next) {
  const { section } = req.params
  const data = req.body?.data
  const validationError = validateSection(section, data)
  if (validationError) return res.status(400).json({ error: validationError })
  try {
    const user = await User.findById(req.user._id).select('+profile.candidate.currentSalary')
    if (!user || user.role !== 'candidate') return res.status(404).json({ error: 'Candidate account could not be found.' })
    if (section === 'personal') {
      const city = data.city ?? user.profile.candidate.city
      const state = data.state ?? user.profile.candidate.state
      if ([city, state].filter(Boolean).join(', ').length > 120) {
        return res.status(400).json({ error: 'City and state together must be no longer than 120 characters.' })
      }
      for (const [key, value] of Object.entries(data)) user.set(`profile.candidate.${key}`, value)
      if (Object.hasOwn(data, 'city') || Object.hasOwn(data, 'state')) user.profile.location = [city, state].filter(Boolean).join(', ')
    } else {
      const field = section === 'contact' ? data
        : section === 'preferences' ? data
          : section === 'summary' ? data
            : { [section]: data[section] }
      for (const [key, value] of Object.entries(field)) user.set(`profile.candidate.${key}`, value)
    }
    await user.save()
    return res.json({ profile: serializeProfile(user) })
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: `Profile details are invalid: ${error.message}` })
    return next(error)
  }
}

async function getDashboard(req, res, next) {
  try {
    const [user, applications] = await Promise.all([
      User.findById(req.user._id),
      Application.find({ candidate: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({ path: 'job', populate: { path: 'employerId', select: 'profile.organizationName profile.website profile.industry' } }),
    ])
    if (!user) return res.status(404).json({ error: 'Candidate account could not be found.' })

    const profile = user.profile.candidate
    const experienceYears = candidateExperience(profile)
    const skillSet = new Set((profile.skills || []).map(item => normalizeSkill(item.name)))
    const activeJobs = await Job.find({ status: 'active', deadline: { $gte: new Date() } })
      .sort({ createdAt: -1 })
      .populate('employerId', 'profile.organizationName profile.website profile.industry')
    const recommendations = activeJobs.map(job => {
      const eligible = isEligible(job, experienceYears)
      const score = eligible ? matchScore(job, skillSet) : null
      return { job, eligible, matchScore: score }
    })
    const eligible = recommendations.filter(item => item.eligible)
    const skillGaps = [...new Set(eligible.flatMap(item => item.job.requiredSkills || [])
      .filter(skill => !skillSet.has(normalizeSkill(skill))))]
      .slice(0, 30)
    const sortedRecommendations = recommendations
      .filter(item => item.eligible)
      .sort((left, right) => (right.matchScore ?? -1) - (left.matchScore ?? -1) || right.job.createdAt - left.job.createdAt)
      .slice(0, 8)
    const savedIds = new Set((profile.savedJobs || []).map(id => id.toString()))
    const savedJobs = activeJobs.filter(job => savedIds.has(job._id.toString())).slice(0, 8)
    const recentApplications = applications.map(serializeApplication)

    return res.json({
      dashboard: {
        candidate: { fullName: user.fullName, location: user.profile.location || '' },
        profileCompletion: profileCompletion(user),
        stats: {
          eligibleOpportunities: eligible.length,
          strongMatches: eligible.filter(item => item.matchScore !== null && item.matchScore >= 80).length,
          applicationsSubmitted: await Application.countDocuments({ candidate: req.user._id }),
          skillsToImprove: skillGaps.length,
        },
        applications: recentApplications,
        savedJobs: savedJobs.map(job => serializeJob(job, job.employerId)),
        recommendations: sortedRecommendations.map(item => ({
          ...serializeJob(item.job, item.job.employerId),
          eligible: item.eligible,
          matchScore: item.matchScore,
          missingSkills: (item.job.requiredSkills || []).filter(skill => !skillSet.has(normalizeSkill(skill))),
          saved: savedIds.has(item.job._id.toString()),
        })),
        skillGaps,
      },
    })
  } catch (error) {
    return next(error)
  }
}

async function getSkillGapAnalysis(req, res, next) {
  try {
    const [user, jobs] = await Promise.all([
      User.findById(req.user._id),
      Job.find({ status: 'active', deadline: { $gte: new Date() } })
        .sort({ createdAt: -1 })
        .populate('employerId', 'profile.organizationName'),
    ])
    if (!user) return res.status(404).json({ error: 'Candidate account could not be found.' })
    return res.json({ analysis: buildCandidateSkillAnalysis(user.profile.candidate, jobs) })
  } catch (error) {
    return next(error)
  }
}

async function getSkillGapPreview(req, res, next) {
  try {
    return res.json({ analysis: buildCandidateSkillAnalysis(previewProfile, previewJobs, { preview: true }) })
  } catch (error) {
    return next(error)
  }
}

async function listApplications(req, res, next) {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate({ path: 'job', populate: { path: 'employerId', select: 'profile.organizationName profile.website profile.industry' } })
    return res.json({ applications: applications.map(serializeApplication) })
  } catch (error) {
    return next(error)
  }
}

async function listSavedJobs(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: 'Candidate account could not be found.' })
    const jobs = await Job.find({
      _id: { $in: user.profile.candidate.savedJobs || [] },
      status: 'active',
      deadline: { $gte: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate('employerId', 'profile.organizationName profile.website profile.industry')
    return res.json({ jobs: jobs.map(job => serializeJob(job, job.employerId)) })
  } catch (error) {
    return next(error)
  }
}

async function applyToJob(req, res, next) {
  const jobId = req.body?.jobId
  const coverNote = req.body?.coverNote == null ? '' : req.body.coverNote
  if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ error: 'Choose a valid job posting.' })
  if (typeof coverNote !== 'string' || coverNote.length > 3000) return res.status(400).json({ error: 'The cover note must be at most 3,000 characters.' })
  try {
    const job = await Job.findOne({ _id: jobId, status: 'active', deadline: { $gte: new Date() } })
    if (!job) return res.status(404).json({ error: 'This job is no longer accepting applications.' })
    const existing = await Application.findOne({ candidate: req.user._id, job: job._id })
    if (existing) return res.status(409).json({ error: 'You have already applied to this job.' })
    const application = await Application.create({ candidate: req.user._id, job: job._id, coverNote: coverNote.trim() })
    const populated = await Application.findById(application._id)
      .populate({ path: 'job', populate: { path: 'employerId', select: 'profile.organizationName profile.website profile.industry' } })
    return res.status(201).json({ application: serializeApplication(populated) })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'You have already applied to this job.' })
    return next(error)
  }
}

async function saveJob(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.jobId)) return res.status(400).json({ error: 'Choose a valid job posting.' })
  try {
    const job = await Job.findOne({ _id: req.params.jobId, status: 'active', deadline: { $gte: new Date() } })
    if (!job) return res.status(404).json({ error: 'This job is no longer available to save.' })
    await User.updateOne({ _id: req.user._id, role: 'candidate' }, { $addToSet: { 'profile.candidate.savedJobs': job._id } })
    return res.json({ saved: true, jobId: job._id.toString() })
  } catch (error) {
    return next(error)
  }
}

async function unsaveJob(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.jobId)) return res.status(400).json({ error: 'Choose a valid job posting.' })
  try {
    await User.updateOne({ _id: req.user._id, role: 'candidate' }, { $pull: { 'profile.candidate.savedJobs': req.params.jobId } })
    return res.json({ saved: false, jobId: req.params.jobId })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  applyToJob,
  candidateExperience,
  getDashboard,
  getProfile,
  getSkillGapAnalysis,
  getSkillGapPreview,
  isFresher,
  normalizeSkill,
  isFresher,
  listApplications,
  listSavedJobs,
  normalizeSkill,
  matchScore,
  isEligible,
  profileCompletion,
  saveJob,
  serializeApplication,
  unsaveJob,
  updateProfileSection,
  serializeProfile,
  validateSection,
}
