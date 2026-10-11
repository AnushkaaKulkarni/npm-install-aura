const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema({
  canonicalId: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 100, index: true },
  aliases: { type: [String], default: [] },
  targetRoles: { type: [String], default: [], index: true },
  status: { type: String, enum: ['approved', 'pending'], default: 'approved', index: true },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('Skill', skillSchema)
