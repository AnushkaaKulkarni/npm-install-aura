import type { TutorLesson, TutorSessionConfig } from './types'

export async function createTutorSession(config: TutorSessionConfig): Promise<TutorLesson> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
  if (!apiUrl) throw new Error('The API is not configured. Set NEXT_PUBLIC_API_URL and try again.')
  const response = await fetch(`${apiUrl}/ai-tutor/sessions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Unable to create the tutoring session.')
  if (!result.lesson?.introduction || !result.lesson?.sections?.length || !result.lesson?.concepts?.length || !result.lesson?.examples?.length || !result.lesson?.summary) {
    throw new Error('The tutor returned an incomplete lesson. Please try again.')
  }
  return result.lesson as TutorLesson
}
