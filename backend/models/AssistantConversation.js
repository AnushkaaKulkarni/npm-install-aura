const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 8000 },
}, { timestamps: true })

const conversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true, maxlength: 100, default: 'Career conversation' },
  language: { type: String, trim: true, maxlength: 40, default: 'English' },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true })

conversationSchema.index({ user: 1, updatedAt: -1 })

module.exports = mongoose.model('AssistantConversation', conversationSchema)
