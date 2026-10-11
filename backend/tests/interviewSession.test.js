const assert = require('node:assert/strict')
const test = require('node:test')
const InterviewSession = require('../models/InterviewSession')
const { validateSessionRequest } = require('../controllers/interviewController')

test('interview session settings and persisted report schema validate', () => {
  const settings = {
    jobRole: 'Backend Engineer',
    interviewType: 'Technical',
    difficulty: 'Medium',
    durationMinutes: 15,
    totalQuestions: 5,
  }
  assert.equal(validateSessionRequest(settings), null)
  assert.match(validateSessionRequest({ ...settings, totalQuestions: 8 }), /question count/)
  assert.match(validateSessionRequest({ ...settings, durationMinutes: 20 }), /15 or 30/)

  const session = new InterviewSession({
    candidate: '507f1f77bcf86cd799439011',
    ...settings,
    questions: [{ question: 'How would you debug a slow endpoint?', category: 'Problem solving' }],
    report: {
      overallScore: null,
      dimensions: {
        technicalAccuracy: null,
        communicationClarity: null,
        answerRelevance: null,
        problemSolving: null,
        completeness: null,
      },
      strengths: [],
      weaknesses: [],
      knowledgeGaps: [],
      improvedAnswerOutlines: [],
      practiceRecommendations: [],
      confidenceEstimate: null,
    },
  })
  assert.equal(session.validateSync(), undefined)
  assert.equal(session.report.overallScore, null)
  assert.equal(session.report.confidenceEstimate, null)
})
