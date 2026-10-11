const mongoose = require('mongoose')

const roleValues = ['candidate', 'employer', 'provider']

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: roleValues },
  verificationStatus: {
    type: String,
    required: true,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  profile: {
    location: { type: String, trim: true, maxlength: 120 },
    highestEducation: { type: String, trim: true, maxlength: 120 },
    organizationName: { type: String, trim: true, maxlength: 160 },
    designation: { type: String, trim: true, maxlength: 100 },
    website: { type: String, trim: true, maxlength: 2048 },
  },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
