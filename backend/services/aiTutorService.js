const { completeWithGroq } = require('./groqClient')

const supportedLanguages = ['English', 'Hindi', 'Marathi']
const supportedDurations = [5, 10, 15, 20]

function cleanText(value, maximum = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : ''
}

function normalizeLesson(value, topic) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error('The tutor could not format a complete lesson. Please try again.')
    error.status = 502
    throw error
  }
  const lesson = {
    topic: cleanText(value.topic, 160) || topic,
    introduction: cleanText(value.introduction),
    sections: Array.isArray(value.sections) ? value.sections.slice(0, 12).map(section => ({
      heading: cleanText(section?.heading, 120),
      narration: cleanText(section?.narration),
    })).filter(section => section.heading && section.narration) : [],
    concepts: Array.isArray(value.concepts) ? value.concepts.slice(0, 12).map(concept => ({
      term: cleanText(concept?.term, 120),
      definition: cleanText(concept?.definition, 800),
    })).filter(concept => concept.term && concept.definition) : [],
    examples: Array.isArray(value.examples) ? value.examples.slice(0, 8).map(example => cleanText(example, 1200)).filter(Boolean) : [],
    summary: cleanText(value.summary, 2500),
  }
  const spokenText = [lesson.introduction, ...lesson.sections.map(section => section.narration), ...lesson.concepts.map(concept => `${concept.term}. ${concept.definition}`), ...lesson.examples, lesson.summary].join(' ')
  return { lesson, wordCount: spokenText.split(/\s+/).filter(Boolean).length }
}

async function createTutorLesson({ topic, language, duration }) {
  if (!supportedLanguages.includes(language)) {
    const error = new Error('Choose English, Hindi, or Marathi for the lesson.')
    error.status = 400
    throw error
  }
  if (!supportedDurations.includes(duration)) {
    const error = new Error('Choose a session duration of 5, 10, 15, or 20 minutes.')
    error.status = 400
    throw error
  }

  const targetWords = duration * 130
  const system = `You are a patient, accurate classroom tutor. Teach only the requested topic at an accessible beginner-to-intermediate level. Write the entire lesson in ${language}, including all headings, definitions and examples. The requested teaching time is ${duration} minutes; produce approximately ${targetWords} spoken words so the lesson is substantial enough for that session. Return a valid JSON object with exactly these fields: {"topic": string, "introduction": string, "sections": [{"heading": string, "narration": string}], "concepts": [{"term": string, "definition": string}], "examples": [string], "summary": string}. Include at least 4 clearly ordered teaching sections, 4 key concepts with definitions, 2 practical examples, and a useful summary. Keep narration conversational and split it into natural sentences for speech playback. Do not include markdown fences or any text outside the JSON. Be accurate; state uncertainty if needed.`
  const raw = await completeWithGroq({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `Teach me: ${topic}. Duration: ${duration} minutes. Language: ${language}.` },
    ],
    temperature: 0.35,
    maxTokens: Math.min(6000, Math.max(1800, duration * 300)),
    responseFormat: { type: 'json_object' },
  })

  let parsed
  try { parsed = JSON.parse(raw) } catch {
    const error = new Error('The tutor could not format a complete lesson. Please try again.')
    error.status = 502
    throw error
  }
  const { lesson, wordCount } = normalizeLesson(parsed, topic)
  if (!lesson.introduction || lesson.sections.length < 3 || lesson.concepts.length < 3 || lesson.examples.length < 1 || !lesson.summary || wordCount < duration * 55) {
    const error = new Error('The tutor response was incomplete, so no session was started. Please try again.')
    error.status = 502
    throw error
  }
  return { ...lesson, language, duration, wordCount }
}

module.exports = { createTutorLesson, supportedDurations, supportedLanguages }
