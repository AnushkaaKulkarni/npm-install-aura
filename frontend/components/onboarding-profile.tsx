'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export function OnboardingProfile({ role }: { role: string }) {
  const [done, setDone] = useState(false)
  const title = role === 'employer' ? 'Set up your employer profile' : role === 'provider' ? 'Set up your training-provider profile' : 'Set up your candidate profile'
  if (done) return <main className="auth-wrap"><div className="auth-card success-state"><CheckCircle2/><span className="eyebrow">Profile saved</span><h1>You are ready to continue.</h1><p>Your optional fields can be completed later from your workspace.</p><Link href={role === 'employer' ? '/employer/dashboard' : role === 'provider' ? '/provider/dashboard' : '/candidate/dashboard'} className="button primary">Open your workspace <ArrowRight/></Link></div></main>
  return <main className="auth-wrap"><div className="auth-card onboarding-card"><span className="eyebrow">Step 3 · Profile details</span><h1>{title}</h1><p>Share only the details that help us personalize your RozgarLink experience. Optional fields can be skipped.</p><form onSubmit={e=>{e.preventDefault();setDone(true)}}><label>{role==='candidate'?'Preferred job role':role==='employer'?'Organization name':'Provider or institution name'}<input required placeholder={role==='candidate'?'Software Developer':role==='employer'?'Your organization':'Your institution'}/></label><label>{role==='candidate'?'Location':role==='employer'?'Industry':'Learning categories'}<input placeholder={role==='candidate'?'Pune, Maharashtra':'e.g. Technology, Data, Career skills'}/></label><label>{role==='candidate'?'Skills and experience':'Organization description'}<textarea placeholder={role==='candidate'?'Python, SQL, React · 0–2 years':'A short description (optional)'}/></label><button className="button primary full">Save and continue <ArrowRight/></button></form><button className="skip-button" onClick={()=>setDone(true)}>Skip optional details for now</button></div></main>
}
