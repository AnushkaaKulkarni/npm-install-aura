const assert = require('node:assert/strict')
const test = require('node:test')
const {
  evaluateAnswer,
  generateInterviewReport,
  generateQuestion,
  transcribeAudio,
} = require('../services/geminiInterview')

test('Gemini interview question, assessment, transcription, report, and truncation handling', async () => {
  const originalKey = process.env.GEMINI_INTERVIEW_API_KEY
  const originalFetch = global.fetch
  process.env.GEMINI_INTERVIEW_API_KEY = 'test-key'
  const requests = []
  const dimensions = {
    technicalAccuracy: 80,
    communicationClarity: 85,
    answerRelevance: 90,
    problemSolving: 75,
    completeness: 70,
  }
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body)
    requests.push(body)
    const prompt = body.contents[0].parts[0].text
    let response
    if (prompt.includes('Generate exactly one original interview question')) {
      response = { question: 'How would you debug a slow API endpoint?', category: 'Problem solving' }
    } else if (prompt.includes('evaluating a candidate response')) {
      response = { score: 80, summary: 'A clear and relevant response.', strengths: ['Used a structured example.'], improvements: ['Include an impact measure.'], sampleAnswer: 'I would measure latency, isolate the slow dependency, and test a focused fix.', dimensions }
    } else if (prompt.startsWith('Create a concise, personalized coaching report')) {
      response = { strengths: ['Explains a structured debugging approach.'], weaknesses: ['Could quantify the outcome.'], knowledgeGaps: ['Review service-level indicators.'], improvedAnswerOutlines: ['State the metric, investigation, action, and result.'], practiceRecommendations: ['Practice concise STAR examples.'] }
    } else {
      response = null
    }
    const text = response ? JSON.stringify(response) : 'I measured p95 latency and found a slow database query.'
    return {
      ok: true,
      json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text }] } }] }),
    }
  }

  try {
    const question = await generateQuestion({
      jobRole: 'Backend Engineer',
      interviewType: 'Technical',
      difficulty: 'Medium',
      questionNumber: 1,
      totalQuestions: 5,
      previousQuestions: [],
    })
    assert.equal(question.category, 'Problem solving')
    assert.deepEqual(requests[0].generationConfig.responseSchema.required, ['question', 'category'])
    assert.deepEqual(requests[0].generationConfig.thinkingConfig, { thinkingBudget: 0 })

    const feedback = await evaluateAnswer({
      jobRole: 'Backend Engineer',
      interviewType: 'Technical',
      difficulty: 'Medium',
      question: question.question,
      answer: 'I measured p95 latency and investigated a slow database query.',
    })
    assert.equal(feedback.score, 80)
    assert.equal(feedback.dimensions.technicalAccuracy, 80)
    assert.ok(requests[1].generationConfig.responseSchema.required.includes('dimensions'))

    const report = await generateInterviewReport({
      jobRole: 'Backend Engineer',
      interviewType: 'Technical',
      difficulty: 'Medium',
      questions: [{ question: question.question, answer: 'A transcript.', evaluation: feedback }],
    })
    assert.equal(report.knowledgeGaps[0], 'Review service-level indicators.')

    const transcript = await transcribeAudio({ audioBase64: 'UklGRg==', mimeType: 'audio/wav' })
    assert.match(transcript, /p95 latency/)
    assert.equal(requests[3].contents[0].parts[1].inlineData.mimeType, 'audio/wav')
    assert.equal(requests[3].contents[0].parts[1].inlineData.data, 'UklGRg==')

    global.fetch = async () => ({
      ok: true,
      json: async () => ({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{' }] } }] }),
    })
    await assert.rejects(
      generateQuestion({
        jobRole: 'Backend Engineer',
        interviewType: 'Technical',
        difficulty: 'Medium',
        questionNumber: 1,
        totalQuestions: 5,
        previousQuestions: [],
      }),
      /response was incomplete/,
    )
  } finally {
    global.fetch = originalFetch
    if (originalKey === undefined) delete process.env.GEMINI_INTERVIEW_API_KEY
    else process.env.GEMINI_INTERVIEW_API_KEY = originalKey
  }
})
