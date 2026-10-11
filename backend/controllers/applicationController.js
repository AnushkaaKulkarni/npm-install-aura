const mongoose = require('mongoose')
const Application = require('../models/Application')
const Job = require('../models/Job')

const applicationStatuses = ['Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected']
const employerCandidateFields = 'fullName email phone profile.location profile.highestEducation profile.candidate.headline profile.candidate.skills'

function serializeEmployerApplication(application) {
  const candidate = application.candidate
  const job = application.job
  return {
    id: application._id.toString(),
    status: application.status,
    coverNote: application.coverNote,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    job: job ? { id: job._id.toString(), title: job.title, location: job.location, requiredSkills: job.requiredSkills || [] } : null,
    candidate: candidate ? {
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.profile?.location || '',
      highestEducation: candidate.profile?.highestEducation || '',
      headline: candidate.profile?.candidate?.headline || '',
      skills: (candidate.profile?.candidate?.skills || []).map(skill => ({
        name: skill.name,
        proficiency: skill.proficiency,
      })),
    } : null,
  }
}

async function listEmployerApplications(req, res, next) {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).select('_id')
    const applications = await Application.find({ job: { $in: jobs.map(job => job._id) } })
      .sort({ createdAt: -1 })
      .populate('candidate', employerCandidateFields)
      .populate('job', 'title location requiredSkills')
    return res.json({ applications: applications.map(serializeEmployerApplication) })
  } catch (error) {
    return next(error)
  }
}

async function updateEmployerApplicationStatus(req, res, next) {
  const { applicationId } = req.params
  const { status } = req.body || {}
  if (!mongoose.isValidObjectId(applicationId)) return res.status(400).json({ error: 'Choose a valid application.' })
  if (!applicationStatuses.includes(status)) return res.status(400).json({ error: 'Choose a valid application status.' })

  try {
    const application = await Application.findById(applicationId).populate('job', 'employerId')
    if (!application || !application.job || application.job.employerId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Application could not be found for your job postings.' })
    }
    application.status = status
    await application.save()
    const updated = await Application.findById(application._id)
      .populate('candidate', employerCandidateFields)
      .populate('job', 'title location requiredSkills')
    return res.json({ application: serializeEmployerApplication(updated) })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  applicationStatuses,
  listEmployerApplications,
  serializeEmployerApplication,
  updateEmployerApplicationStatus,
}
