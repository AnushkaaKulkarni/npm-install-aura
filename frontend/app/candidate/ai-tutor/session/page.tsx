import { redirect } from 'next/navigation'
import { Dashboard } from '@/components/platform'
import type { TutorDuration, TutorLanguage } from '@/lib/ai-tutor/types'

const languages: TutorLanguage[] = ['English', 'Hindi', 'Marathi']
const durations: TutorDuration[] = [5, 10, 15, 20]

export default async function AiTutorSessionPage({ searchParams }: { searchParams: Promise<{ topic?: string; language?: string; duration?: string }> }) {
  const params = await searchParams
  const topic = params.topic?.trim() || ''
  const language = params.language as TutorLanguage
  const duration = Number(params.duration) as TutorDuration
  if (topic.length < 2 || topic.length > 160 || !languages.includes(language) || !durations.includes(duration)) redirect('/candidate/ai-tutor')
  return <Dashboard role="candidate" section="AI Tutor" tutorSession={{ topic, language, duration }} />
}
