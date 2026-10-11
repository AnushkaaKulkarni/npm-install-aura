const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  score: { type: Number, required: true, min: 0, max: 100 },
  summary: { type: String, required: true, maxlength: 1200 },
  strengths: [{ type: String, maxlength: 300 }],
  improvements: [{ type: String, maxlength: 300 }],
  sampleAnswer: { type: String, required: true, maxlength: 2500 },
  dimensions: {
    technicalAccuracy: { type: Number, required: true, min: 0, max: 100 },
    communicationClarity: { type: Number, required: true, min: 0, max: 100 },
    answerRelevance: { type: Number, required: true, min: 0, max: 100 },
    problemSolving: { type: Number, required: true, min: 0, max: 100 },
    completeness: { type: Number, required: true, min: 0, max: 100 },
  },
}, { _id: false })

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, maxlength: 1200 },
  category: { type: String, required: true, maxlength: 80 },
  originalTranscript: { type: String, maxlength: 6000 },
  editedTranscript: { type: String, maxlength: 6000 },
  audioMimeType: { type: String, maxlength: 100 },
  recordingDurationMs: { type: Number, min: 0, max: 120000 },
  evaluationInProgress: { type: Boolean, default: false },
  feedback: { type: feedbackSchema, default: undefined },
  answeredAt: { type: Date },
}, { _id: false })

const reportSchema = new mongoose.Schema({
  overallScore: { type: Number, min: 0, max: 100, default: null },
  dimensions: {
    technicalAccuracy: { type: Number, min: 0, max: 100, default: null },
    communicationClarity: { type: Number, min: 0, max: 100, default: null },
    answerRelevance: { type: Number, min: 0, max: 100, default: null },
    problemSolving: { type: Number, min: 0, max: 100, default: null },
    completeness: { type: Number, min: 0, max: 100, default: null },
  },
  strengths: [{ type: String, maxlength: 500 }],
  weaknesses: [{ type: String, maxlength: 500 }],
  knowledgeGaps: [{ type: String, maxlength: 500 }],
  improvedAnswerOutlines: [{ type: String, maxlength: 500 }],
  practiceRecommendations: [{ type: String, maxlength: 500 }],
  confidenceEstimate: { type: Number, min: 0, max: 100, default: null },
  confidenceNote: { type: String, maxlength: 300, default: 'Not assessed. This report uses transcripts only; no vocal or visual analysis was performed.' },
}, { _id: false })

const interviewSessionSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobRole: { type: String, required: true, trim: true, maxlength: 120 },
  interviewType: { type: String, required: true, enum: ['Technical', 'HR', 'Aptitude', 'Coding', 'Role-specific'] },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
  durationMinutes: { type: Number, required: true, enum: [15, 30] },
  totalQuestions: { type: Number, required: true, min: 1, max: 8 },
  currentQuestionIndex: { type: Number, required: true, default: 0 },
  advancementInProgress: { type: Boolean, default: false },
  questions: { type: [questionSchema], default: [] },
  status: { type: String, enum: ['active', 'completed', 'ended'], default: 'active', index: true },
  report: { type: reportSchema, default: undefined },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
}, { timestamps: true })

interviewSessionSchema.index({ candidate: 1, createdAt: -1 })

module.exports = mongoose.model('InterviewSession', interviewSessionSchema)
