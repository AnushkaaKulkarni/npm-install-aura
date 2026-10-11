'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Clock3, GraduationCap, Languages, PlayCircle, Sparkles, Volume2 } from 'lucide-react'
import type { TutorDuration, TutorLanguage } from '@/lib/ai-tutor/types'

const durations: TutorDuration[] = [5, 10, 15, 20]
const languages: TutorLanguage[] = ['English', 'Hindi', 'Marathi']
const examples = ['Operating Systems', 'SQL', 'MERN Stack', 'Python']

export function AiTutorSetup() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState<TutorLanguage>('English')
  const [duration, setDuration] = useState<TutorDuration>(5)
  const [error, setError] = useState('')

  function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanedTopic = topic.trim()
    if (cleanedTopic.length < 2 || cleanedTopic.length > 160) {
      setError('Enter a topic between 2 and 160 characters.')
      return
    }
    const params = new URLSearchParams({ topic: cleanedTopic, language, duration: String(duration) })
    router.push(`/candidate/ai-tutor/session?${params.toString()}`)
  }

  return <div className="ai-tutor-page">
    <header className="tutor-page-heading"><span className="tutor-title-icon"><GraduationCap size={27}/></span><div><h1>AI Tutor</h1><p>Learn any topic with your personal AI classroom teacher.</p></div></header>
    <div className="tutor-setup-grid">
      <form className="panel tutor-setup-card" onSubmit={startSession}>
        <h2>Start a Learning Session</h2>
        <label className="tutor-field"><span>Choose a Topic <i>*</i></span><input required minLength={2} maxLength={160} value={topic} onChange={event=>{setTopic(event.target.value);setError('')}} placeholder="What would you like to learn today?"/><small>Example: “Deadlock in Operating Systems”</small></label>
        <div className="tutor-field"><span><Languages size={16}/> Lesson language</span><div className="language-options" role="group" aria-label="Lesson language">{languages.map(item=><button key={item} type="button" className={language===item?'selected':''} onClick={()=>setLanguage(item)}>{item}</button>)}</div></div>
        <label className="tutor-field"><span><Clock3 size={16}/> Session Duration (Minutes)</span><select value={duration} onChange={event=>setDuration(Number(event.target.value) as TutorDuration)}>{durations.map(value=><option key={value} value={value}>{value} minutes</option>)}</select><small>Choose how long you want to study.</small></label>
        {error&&<p className="tutor-error" role="alert">{error}</p>}
        <button className="button primary tutor-start-button" type="submit"><ArrowRight size={18}/> Start Learning Session</button>
      </form>
      <aside className="panel tutor-benefits"><h2>What You’ll Get</h2><ol>{[
        [<Sparkles size={18}/>, 'Animated AI Avatar', 'A friendly animated classroom tutor'],
        [<Volume2 size={18}/>, 'Live Explanation', 'Progressive teaching synchronized with speech'],
        [<Clock3 size={18}/>, 'Session Timer', 'A countdown for your selected study time'],
        [<PlayCircle size={18}/>, 'Playback Controls', 'Pause, resume, replay and adjust speech speed'],
      ].map(([icon,title,description],index)=><li key={String(title)}><span className="benefit-number">{index+1}</span><span className="benefit-icon">{icon}</span><div><b>{title}</b><small>{description}</small></div></li>)}</ol><div className="example-topics"><b>Example Topics:</b><div>{examples.map(example=><button key={example} type="button" onClick={()=>setTopic(example)}>{example}</button>)}</div></div></aside>
    </div>
  </div>
}
