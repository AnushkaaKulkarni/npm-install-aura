import { OnboardingProfile } from '@/components/onboarding-profile'

export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role = 'candidate' } = await searchParams
  return <div className="auth-page"><OnboardingProfile role={role} /></div>
}
