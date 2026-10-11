const InterviewSession = require('../models/InterviewSession')
const {
  evaluateAnswer,
  generateInterviewReport,
  generateQuestion,
  transcribeAudio,
} = require('../services/geminiInterview')

const interviewTypes = ['Technical', 'HR', 'Aptitude', 'Coding', 'Role-specific']
const difficulties = ['Easy', 'Medium', 'Hard']
const dimensionNames = ['technicalAccuracy', 'communicationClarity', 'answerRelevance', 'problemSolving', 'completeness']

function validateQuestionRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Interview settings must be a JSON object.'
  if (typeof body.jobRole !== 'string' || !body.jobRole.trim() || body.jobRole.trim().length > 120) return 'Enter a target role (maximum 120 characters).'
  if (!interviewTypes.includes(body.interviewType)) return 'Select a valid interview type.'
  if (!difficulties.includes(body.difficulty)) return 'Select a valid difficulty.'
  if (!Number.isInteger(body.questionNumber) || body.questionNumber < 1 || body.questionNumber > 8) return 'Question number must be between 1 and 8.'
  if (!Number.isInteger(body.totalQuestions) || body.totalQuestions < 1 || body.totalQuestions > 8) return 'Choose between 1 and 8 questions.'
  if (body.questionNumber > body.totalQuestions) return 'Question number cannot exceed the interview length.'
  if (!Array.isArray(body.previousQuestions) || body.previousQuestions.length > 7) return 'The previous questions list is invalid.'
  if (body.previousQuestions.some(item => typeof item !== 'string' || item.length > 1200)) return 'A previous question is invalid.'
  return null
}

function validateAnswerRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Answer details must be a JSON object.'
  if (typeof body.jobRole !== 'string' || !body.jobRole.trim() || body.jobRole.trim().length > 120) return 'Enter a valid target role.'
  if (!interviewTypes.includes(body.interviewType)) return 'Select a valid interview type.'
  if (!difficulties.includes(body.difficulty)) return 'Select a valid difficulty.'
  if (typeof body.question !== 'string' || !body.question.trim() || body.question.length > 1200) return 'The interview question is invalid.'
  if (typeof body.answer !== 'string' || !body.answer.trim() || body.answer.length > 6000) return 'Enter an answer (maximum 6,000 characters).'
  return null
}

async function getQuestion(req, res, next) {
  const error = validateQuestionRequest(req.body)
  if (error) return res.status(400).json({ error })
  try {
    const question = await generateQuestion({
      jobRole: req.body.jobRole.trim(),
      interviewType: req.body.interviewType,
      difficulty: req.body.difficulty,
      questionNumber: req.body.questionNumber,
      totalQuestions: req.body.totalQuestions,
      previousQuestions: req.body.previousQuestions,
    })
    return res.json({ question })
  } catch (reason) {
    return next(reason)
  }
}

async function submitAnswer(req, res, next) {
  const error = validateAnswerRequest(req.body)
  if (error) return res.status(400).json({ error })
  try {
    const feedback = await evaluateAnswer({
      jobRole: req.body.jobRole.trim(),
      interviewType: req.body.interviewType,
      difficulty: req.body.difficulty,
      question: req.body.question.trim(),
      answer: req.body.answer.trim(),
    })
    return res.json({ feedback })
  } catch (reason) {
    return next(reason)
  }
}

function validateSessionRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Interview settings must be a JSON object.'
  if (typeof body.jobRole !== 'string' || !body.jobRole.trim() || body.jobRole.trim().length > 120) return 'Enter a target role (maximum 120 characters).'
  if (!interviewTypes.includes(body.interviewType)) return 'Select a valid interview type.'
  if (!difficulties.includes(body.difficulty)) return 'Select a valid difficulty.'
  if (![15, 30].includes(body.durationMinutes)) return 'Choose a 15 or 30 minute interview.'
  if (body.totalQuestions !== (body.durationMinutes === 30 ? 8 : 5)) return 'The question count must match the selected interview duration.'
  return null
}

function serializeSession(session) {
  return {
    id: session.id,
    jobRole: session.jobRole,
    interviewType: session.interviewType,
    difficulty: session.difficulty,
    durationMinutes: session.durationMinutes,
    totalQuestions: session.totalQuestions,
    currentQuestionIndex: session.currentQuestionIndex,
    questions: session.questions,
    status: session.status,
    report: session.report || null,
    startedAt: session.startedAt,
    endedAt: session.endedAt || null,
    createdAt: session.createdAt,
  }
}

async function createSession(req, res, next) {
  const error = validateSessionRequest(req.body)
  if (error) return res.status(400).json({ error })
  try {
    const settings = {
      jobRole: req.body.jobRole.trim(),
      interviewType: req.body.interviewType,
      difficulty: req.body.difficulty,
      totalQuestions: req.body.totalQuestions,
    }
    const question = await generateQuestion({ ...settings, questionNumber: 1, previousQuestions: [] })
    const session = await InterviewSession.create({
      candidate: req.user._id,
      ...settings,
      durationMinutes: req.body.durationMinutes,
      questions: [question],
    })
    return res.status(201).json({ session: serializeSession(session) })
  } catch (reason) {
    return next(reason)
  }
}

async function getSession(req, res, next) {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, candidate: req.user._id })
    if (!session) return res.status(404).json({ error: 'This interview session could not be found.' })
    return res.json({ session: serializeSession(session) })
  } catch (reason) {
    return next(reason)
  }
}

async function listSessions(req, res, next) {
  try {
    const sessions = await InterviewSession.find({ candidate: req.user._id, report: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(10)
    return res.json({ sessions: sessions.map(serializeSession) })
  } catch (reason) {
    return next(reason)
  }
}

async function transcribeSessionAnswer(req, res, next) {
  const { audioBase64, mimeType, recordingDurationMs } = req.body || {}
  const questionIndex = req.body?.questionIndex
  if (typeof audioBase64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64) || audioBase64.length > 7_000_000) {
    return res.status(400).json({ error: 'The recording is missing or exceeds the 5 MB transcription limit. Type your answer below instead.' })
  }
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex > 7) return res.status(400).json({ error: 'The interview question index is invalid.' })
  const allowedMimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg']
  if (!allowedMimeTypes.includes(mimeType)) return res.status(400).json({ error: 'This recording format is not supported. Type your answer below instead.' })
  const audioBytes = Buffer.from(audioBase64, 'base64')
  if (audioBytes.length < 1024 || audioBytes.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'The recording must be between 1 KB and 5 MB. Type your answer below instead.' })
  if (!Number.isInteger(recordingDurationMs) || recordingDurationMs < 0 || recordingDurationMs > 120000) {
    return res.status(400).json({ error: 'The recording duration is invalid.' })
  }

  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      candidate: req.user._id,
      status: 'active',
      [`questions.${questionIndex}.question`]: { $exists: true },
    })
    if (!session) return res.status(404).json({ error: 'This active interview question could not be found.' })
    if (session.currentQuestionIndex !== questionIndex) return res.status(409).json({ error: 'This is no longer the current interview question.' })
    const transcript = await transcribeAudio({ audioBase64, mimeType: mimeType.split(';')[0] })
    return res.json({ transcript, transcriptionProvider: 'Gemini audio transcription' })
  } catch (reason) {
    return next(reason)
  }
}

async function submitSessionAnswer(req, res, next) {
  const { questionIndex, originalTranscript, editedTranscript, audioMimeType, recordingDurationMs } = req.body || {}
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex > 7) return res.status(400).json({ error: 'The interview question index is invalid.' })
  if (typeof editedTranscript !== 'string' || !editedTranscript.trim() || editedTranscript.trim().length > 6000) return res.status(400).json({ error: 'Enter an answer (maximum 6,000 characters).' })
  if (typeof originalTranscript !== 'string' || originalTranscript.length > 6000) return res.status(400).json({ error: 'The original transcript is invalid.' })
  if (audioMimeType != null && (typeof audioMimeType !== 'string' || audioMimeType.length > 100)) return res.status(400).json({ error: 'The recording format is invalid.' })
  if (recordingDurationMs != null && (!Number.isInteger(recordingDurationMs) || recordingDurationMs < 0 || recordingDurationMs > 120000)) return res.status(400).json({ error: 'The recording duration is invalid.' })

  const session = await InterviewSession.findOneAndUpdate({
    _id: req.params.id,
    candidate: req.user._id,
    status: 'active',
    advancementInProgress: { $ne: true },
    currentQuestionIndex: questionIndex,
    [`questions.${questionIndex}.feedback`]: { $exists: false },
    [`questions.${questionIndex}.evaluationInProgress`]: { $ne: true },
  }, {
    $set: { [`questions.${questionIndex}.evaluationInProgress`]: true },
  }, { new: true })
  if (!session) return res.status(409).json({ error: 'This answer has already been submitted or the interview question has changed. Refresh the session to continue.' })

  try {
    const question = session.questions[questionIndex]
    const feedback = await evaluateAnswer({
      jobRole: session.jobRole,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      question: question.question,
      answer: editedTranscript.trim(),
    })
    const updated = await InterviewSession.findOneAndUpdate({
      _id: session._id,
      candidate: req.user._id,
      status: 'active',
      currentQuestionIndex: questionIndex,
      [`questions.${questionIndex}.evaluationInProgress`]: true,
      [`questions.${questionIndex}.feedback`]: { $exists: false },
    }, {
      $set: {
        [`questions.${questionIndex}.originalTranscript`]: originalTranscript.trim(),
        [`questions.${questionIndex}.editedTranscript`]: editedTranscript.trim(),
        [`questions.${questionIndex}.audioMimeType`]: audioMimeType || undefined,
        [`questions.${questionIndex}.recordingDurationMs`]: recordingDurationMs,
        [`questions.${questionIndex}.feedback`]: feedback,
        [`questions.${questionIndex}.answeredAt`]: new Date(),
        [`questions.${questionIndex}.evaluationInProgress`]: false,
      },
    }, { new: true })
    if (!updated) return res.status(409).json({ error: 'The interview changed while your answer was being assessed. Refresh the session to check its saved state.' })
    return res.json({ session: serializeSession(updated), feedback })
  } catch (reason) {
    await InterviewSession.updateOne(
      { _id: session._id, [`questions.${questionIndex}.evaluationInProgress`]: true },
      { $set: { [`questions.${questionIndex}.evaluationInProgress`]: false } },
    )
    return next(reason)
  }
}

function mean(values) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
}

async function finishSession(req, res, next) {
  try {
    let session = await InterviewSession.findOne({ _id: req.params.id, candidate: req.user._id })
    if (!session) return res.status(404).json({ error: 'This interview session could not be found.' })
    if (session.report && session.status !== 'active') return res.json({ session: serializeSession(session) })
    if (session.advancementInProgress) return res.status(409).json({ error: 'The next interview question is still being prepared. Please wait.' })
    if (session.questions.some(question => question.evaluationInProgress)) return res.status(409).json({ error: 'An answer is still being assessed. Please wait before ending the interview.' })

    const evaluated = session.questions.filter(question => question.feedback)
    const evaluations = evaluated.map(question => question.feedback)
    const reportText = await generateInterviewReport({
      jobRole: session.jobRole,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      questions: evaluated.map(question => ({
        question: question.question,
        answer: question.editedTranscript,
        originalTranscript: question.originalTranscript,
        evaluation: question.feedback,
      })),
    })
    const dimensions = Object.fromEntries(dimensionNames.map(key => [key, mean(evaluations.map(item => item.dimensions[key]))]))
    session.report = {
      overallScore: mean(evaluations.map(item => item.score)),
      dimensions,
      ...reportText,
      confidenceEstimate: null,
      confidenceNote: 'Not assessed. This report uses transcripts only; no vocal or visual analysis was performed.',
    }
    session.status = req.body?.reason === 'ended' ? 'ended' : 'completed'
    session.endedAt = new Date()
    await session.save()
    return res.json({ session: serializeSession(session) })
  } catch (reason) {
    return next(reason)
  }
}

async function nextSessionQuestion(req, res, next) {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, candidate: req.user._id, status: 'active' })
    if (!session) return res.status(404).json({ error: 'This active interview session could not be found.' })
    const current = session.questions[session.currentQuestionIndex]
    if (!current?.feedback) return res.status(409).json({ error: 'Submit and assess your answer before moving to the next question.' })
    if (session.currentQuestionIndex + 1 >= session.totalQuestions) {
      req.body = {}
      return finishSession(req, res, next)
    }

    const nextIndex = session.currentQuestionIndex + 1
    const claimed = await InterviewSession.findOneAndUpdate({
      _id: session._id,
      candidate: req.user._id,
      status: 'active',
      currentQuestionIndex: session.currentQuestionIndex,
      advancementInProgress: { $ne: true },
      [`questions.${session.currentQuestionIndex}.feedback`]: { $exists: true },
    }, {
      $set: { advancementInProgress: true },
    }, { new: true })
    if (!claimed) return res.status(409).json({ error: 'This answer has already advanced or the interview changed. Refresh the session to continue.' })

    try {
      const question = await generateQuestion({
        jobRole: claimed.jobRole,
        interviewType: claimed.interviewType,
        difficulty: claimed.difficulty,
        questionNumber: nextIndex + 1,
        totalQuestions: claimed.totalQuestions,
        previousQuestions: claimed.questions.map(item => item.question),
      })
      const updated = await InterviewSession.findOneAndUpdate({
        _id: claimed._id,
        candidate: req.user._id,
        status: 'active',
        currentQuestionIndex: session.currentQuestionIndex,
        advancementInProgress: true,
      }, {
        $push: { questions: question },
        $set: { currentQuestionIndex: nextIndex, advancementInProgress: false },
      }, { new: true })
      if (!updated) return res.status(409).json({ error: 'The interview changed while the next question was being prepared. Refresh the session to check its saved state.' })
      return res.json({ session: serializeSession(updated) })
    } catch (reason) {
      await InterviewSession.updateOne(
        { _id: claimed._id, advancementInProgress: true },
        { $set: { advancementInProgress: false } },
      )
      return next(reason)
    }
  } catch (reason) {
    return next(reason)
  }
}

module.exports = {
  createSession,
  finishSession,
  getSession,
  getQuestion,
  listSessions,
  nextSessionQuestion,
  submitAnswer,
  submitSessionAnswer,
  transcribeSessionAnswer,
  validateAnswerRequest,
  validateQuestionRequest,
  validateSessionRequest,
}
