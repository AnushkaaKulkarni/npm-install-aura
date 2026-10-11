const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

async function completeWithGroq({ messages, temperature = 0.45, maxTokens = 900, responseFormat }) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    const error = new Error('The AI service is not configured yet. Add GROQ_API_KEY to the backend environment.')
    error.status = 503
    throw error
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, ...(responseFormat ? { response_format: responseFormat } : {}) }),
    signal: AbortSignal.timeout(45000),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('Groq request failed:', response.status, result.error?.message || 'unknown error')
    const error = new Error(response.status === 429 ? 'The AI service is busy. Please try again in a moment.' : 'The AI service could not generate a response right now.')
    error.status = response.status === 429 ? 429 : 502
    throw error
  }
  const content = result.choices?.[0]?.message?.content?.trim()
  if (!content) {
    const error = new Error('The AI service returned an empty response. Please try again.')
    error.status = 422
    throw error
  }
  return content
}

module.exports = { completeWithGroq }
