const mongoose = require('mongoose')

const resourceTypes = ['video', 'course', 'document', 'exercise', 'external']
const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced']
const statusValues = ['draft', 'under_review', 'published', 'archived']

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  durationMinutes: { type: Number, min: 1, default: 10 },
  durationSeconds: { type: Number, min: 1, default: 600 },
  contentUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  resourceType: { type: String, enum: resourceTypes, default: 'video' },
  order: { type: Number, default: 1 },
}, { _id: true })

const resourceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  resourceType: { type: String, required: true, enum: resourceTypes, index: true },
  contentUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  thumbnailUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  skills: {
    type: [String],
    required: true,
    validate: {
      validator: (val) => Array.isArray(val) && val.length > 0,
      message: 'At least one skill must be associated with the resource.',
    },
    index: true,
  },
  targetRoles: { type: [String], default: [], index: true },
  category: { type: String, required: true, trim: true, maxlength: 100, index: true },
  difficulty: { type: String, enum: difficultyLevels, default: 'Beginner' },
  language: { type: String, trim: true, default: 'English', maxlength: 80 },
  durationMinutes: { type: Number, min: 0, default: 0 },
  durationSeconds: { type: Number, min: 0, default: 0 },
  prerequisites: { type: [String], default: [] },
  learningObjectives: { type: [String], default: [] },
  lessons: { type: [lessonSchema], default: [] },
  status: { type: String, enum: statusValues, default: 'draft', index: true },
  viewsCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true })

resourceSchema.pre('validate', function (next) {
  if (!this.provider && this.providerId) this.provider = this.providerId
  if (!this.providerId && this.provider) this.providerId = this.provider
  next()
})

resourceSchema.index({ status: 1, skills: 1, createdAt: -1 })
resourceSchema.index({ status: 1, targetRoles: 1, createdAt: -1 })
resourceSchema.index({ status: 1, category: 1, createdAt: -1 })

module.exports = mongoose.model('Resource', resourceSchema)
