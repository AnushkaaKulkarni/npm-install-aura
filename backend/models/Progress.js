const mongoose = require('mongoose')

const progressSchema = new mongoose.Schema({
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', index: true },
  lesson: { type: String, default: 'main', index: true },
  lessonId: { type: String, default: 'main', index: true },
  playbackPositionSeconds: { type: Number, default: 0, min: 0 },
  totalDurationSeconds: { type: Number, default: 0, min: 0 },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress', index: true },
  lastActivityAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { timestamps: true })

progressSchema.pre('validate', function (next) {
  if (!this.learner && this.userId) this.learner = this.userId
  if (!this.userId && this.learner) this.userId = this.learner
  if (!this.resource && this.resourceId) this.resource = this.resourceId
  if (!this.resourceId && this.resource) this.resourceId = this.resource
  if (!this.lesson && this.lessonId) this.lesson = this.lessonId
  if (!this.lessonId && this.lesson) this.lessonId = this.lesson
  next()
})

progressSchema.index({ userId: 1, resourceId: 1, lessonId: 1 }, { unique: true })
progressSchema.index({ userId: 1, status: 1, lastActivityAt: -1 })
progressSchema.index({ resourceId: 1, status: 1 })

module.exports = mongoose.model('Progress', progressSchema)
