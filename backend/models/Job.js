const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  department: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: String, required: true, trim: true, maxlength: 160 },
  workMode: { type: String, required: true, enum: ['On-site', 'Hybrid', 'Remote'] },
  employmentType: { type: String, required: true, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
  experience: { type: String, trim: true, maxlength: 80, default: '' },
  salary: { type: String, trim: true, maxlength: 100, default: '' },
  minExperienceYears: { type: Number, min: 0, max: 60 },
  maxExperienceYears: { type: Number, min: 0, max: 60 },
  minSalaryLpa: { type: Number, min: 0, max: 1000 },
  maxSalaryLpa: { type: Number, min: 0, max: 1000 },
  deadline: { type: Date, required: true },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  requiredSkills: { type: [String], required: true, validate: value => value.length > 0 },
  status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active', index: true },
}, { timestamps: true })

jobSchema.index({ status: 1, deadline: 1, createdAt: -1 })

module.exports = mongoose.model('Job', jobSchema)
