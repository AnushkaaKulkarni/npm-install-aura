import { Dashboard } from '@/components/platform'
import { InterviewResults } from '@/components/interview-session'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Dashboard role="candidate" section="Interview Preparation"><InterviewResults sessionId={id}/></Dashboard>
}
