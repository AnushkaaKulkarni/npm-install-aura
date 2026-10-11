import { Dashboard } from '@/components/platform'
import { InterviewSessionRoom } from '@/components/interview-session'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Dashboard role="candidate" section="Interview Preparation"><InterviewSessionRoom sessionId={id}/></Dashboard>
}
