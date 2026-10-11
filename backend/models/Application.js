const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  coverNote: { type: String, trim: true, maxlength: 3000, default: '' },
  status: {
    type: String,
    enum: ['Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
    default: 'Under Review',
    index: true,
  },
}, { timestamps: true })

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true })
applicationSchema.index({ job: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model('Application', applicationSchema)
