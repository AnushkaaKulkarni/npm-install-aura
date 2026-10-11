'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, LoaderCircle, MessageCircle, Play, Search, Sparkles, Target, Upload } from 'lucide-react'

export function FeatureWorkspace({ section }: { section: string }) {
  if (section === 'Interview Preparation') return <InterviewWorkspace />
  if (section === 'AI Career Assistant') return <AssistantWorkspace />
  if (section === 'Resume Studio') return <ResumeWorkspace />
  if (section === 'ATS Resume Analyzer') return <AtsWorkspace />
  if (section === 'Skill Gap Analysis') return <SkillGapWorkspace />
  if (section === 'Recommended Learning / Learning Hub') return <LearningWorkspace />
  if (section === 'Competency Profile') return <CompetencyWorkspace />
  return null
}

function WorkspaceShell({ eyebrow, title, description, status = 'Demo workspace ready', children }: { eyebrow: string; title: string; description: string; status?: string; children: React.ReactNode }) {
  return <div className="feature-workspace"><div className="workspace-intro"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div><span className="workspace-status"><CheckCircle2 size={14} /> {status}</span></div>{children}</div>
}

async function requestInterview<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
  if (!apiBase) throw new Error('The API is not configured. Set NEXT_PUBLIC_API_URL and try again.')

  let response: Response
  try {
    response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Unable to reach the API. Check that the backend is running and try again.')
  }

  let result: T & { error?: string }
  try {
    result = await response.json()
  } catch {
    throw new Error('The API returned an invalid response.')
  }
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.')
  return result
}

function InterviewWorkspace() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const durationMinutes = Number(values.get('duration'))
    const interviewSettings = {
      jobRole: String(values.get('jobRole') || '').trim(),
      interviewType: String(values.get('interviewType') || ''),
      difficulty: String(values.get('difficulty') || ''),
      durationMinutes,
      totalQuestions: durationMinutes === 30 ? 8 : 5,
    }
    setError('')
    setLoading(true)
    try {
      const result = await requestInterview<{ session: { id: string } }>('/interviews/sessions', interviewSettings)
      router.push(`/candidate/interview-prep/session/${result.session.id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start interview practice.')
    } finally {
      setLoading(false)
    }
  }

  return <WorkspaceShell eyebrow="Practice with purpose" title="Interview Preparation" description="Get original interview questions and constructive feedback tailored to your target role." status="AI interview coach">
    {error && <p className="interview-error" role="alert">{error}{error.includes('log in') || error.includes('session') ? <> <a href="/login">Log in</a> and try again.</> : null}</p>}
    <div className="workspace-grid interview-grid">
      <section className="panel setup-panel">
        <div className="panel-heading"><h3>Set up your mock interview</h3><Target size={18}/></div>
        <form className="selector-stack interview-setup" onSubmit={startInterview}>
          <label>Target job role<input name="jobRole" required maxLength={120} defaultValue="Software Developer" placeholder="e.g. Data Analyst"/></label>
          <label>Interview type<select name="interviewType" defaultValue="Technical"><option>Technical</option><option>HR</option><option>Aptitude</option><option>Coding</option><option>Role-specific</option></select></label>
          <div className="two-fields">
            <label>Difficulty<select name="difficulty" defaultValue="Medium"><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
            <label>Duration<select name="duration" defaultValue="15"><option value="15">15 minutes · 5 questions</option><option value="30">30 minutes · 8 questions</option></select></label>
          </div>
          <button className="button primary full" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="interview-spinner" size={15}/> Generating your first question…</> : <>Start mock interview <Play size={14}/></>}</button>
        </form>
      </section>
      <section className="panel interview-info-panel">
        <div className="panel-heading"><h3>How practice works</h3><Sparkles size={18}/></div>
        <div className="interview-info-row"><span>01</span><div><b>Get a role-specific question</b><small>Questions adapt to your selected role, interview type and difficulty.</small></div></div>
        <div className="interview-info-row"><span>02</span><div><b>Answer face to face</b><small>Use your webcam and microphone to record each response, then review its transcript.</small></div></div>
        <div className="interview-info-row"><span>03</span><div><b>Review your detailed report</b><small>Each answer is assessed and saved to your interview history before the next question.</small></div></div>
        <p className="interview-privacy-note">Camera and microphone access are requested when the session opens. Recording starts only when you choose Start Recording.</p>
      </section>
    </div>
  </WorkspaceShell>
}

function AssistantWorkspace() { const [message, setMessage] = useState(''); return <WorkspaceShell eyebrow="Guidance when you need it" title="AI Career Assistant" description="Ask about job requirements, preparation, learning paths or your next best action."><div className="assistant-workspace"><aside className="panel conversation-list"><div className="panel-heading"><h3>Conversations</h3><MessageCircle size={18}/></div>{['Data analyst preparation','Improve my resume','Find roles in Pune'].map((x,i)=><button className={i===0?'conversation active':'conversation'} key={x}>{x}<small>Today · 10:{20+i}</small></button>)}</aside><section className="panel conversation-panel"><div className="context-strip"><Sparkles size={16}/> Context: Software Developer (Fresher) · 92% match</div><div className="messages"><div className="message assistant">Hello Aarav. I can help you understand requirements, prepare answers, or close a skill gap.</div><div className="message user">What should I revise before applying?</div><div className="message assistant">Focus on SQL joins, REST API basics and explaining one project clearly.</div></div><div className="suggested-prompts"><button>Explain the requirements</button><button>Build a revision plan</button><button>Find learning resources</button></div><form className="composer" onSubmit={e=>{e.preventDefault();setMessage('')}}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask your career assistant..." aria-label="Message"/><button className="button primary" type="submit">Send</button></form></section></div></WorkspaceShell> }

function ResumeWorkspace() { return <WorkspaceShell eyebrow="Shape your story" title="Resume Studio" description="Edit targeted resume sections and compare improvements against your chosen opportunity."><div className="workspace-grid resume-grid"><section className="panel editor-panel"><div className="panel-heading"><h3>Resume sections</h3><FileText size={18}/></div>{['Professional summary','Skills','Experience','Education','Projects'].map((x,i)=><div className="resume-section" key={x}><div><b>{x}</b><small>{i===0?'Strong opening for this role':i===1?'4 relevant skills detected':'Ready to edit'}</small></div><button className="button secondary small">Edit</button></div>)}<button className="button primary full">Preview resume</button></section><section className="panel comparison-panel"><div className="panel-heading"><h3>Suggested improvement</h3><Sparkles size={18}/></div><span className="eyebrow">Before</span><p className="comparison before">Worked on web projects and learned programming.</p><span className="eyebrow">After</span><p className="comparison after">Built responsive React applications and integrated REST APIs with measurable performance improvements.</p><div className="workspace-actions"><button className="button secondary">Target job: Software Developer</button><button className="button primary">Export PDF</button></div></section></div></WorkspaceShell> }

function AtsWorkspace() { return <WorkspaceShell eyebrow="Understand your match" title="ATS Resume Analyzer" description="See how your resume covers the target role and which changes can improve compatibility."><div className="workspace-grid ats-grid"><section className="panel score-panel"><span className="eyebrow">Estimated compatibility</span><div className="big-score">78<span>/100</span></div><p>Good foundation. Add evidence for two role requirements to strengthen your match.</p><div className="score-bar"><i style={{width:'78%'}} /></div></section><section className="panel checklist-panel"><div className="panel-heading"><h3>Prioritized checklist</h3><CheckCircle2 size={18}/></div>{['Add REST API project evidence','Mention SQL joins in skills','Use measurable impact in experience','Keep section headings consistent'].map((x,i)=><div className="checklist-row" key={x}><span>{i+1}</span><div><b>{x}</b><small>{i<2?'High priority':'Recommended'}</small></div></div>)}</section></div></WorkspaceShell> }

function SkillGapWorkspace() { return <WorkspaceShell eyebrow="Make the next step clear" title="Skill Gap Analysis" description="Compare your demonstrated skills with what the target opportunity asks for."><div className="workspace-grid skill-gap-grid"><section className="panel"><div className="panel-heading"><h3>Software Developer (Fresher)</h3><Target size={18}/></div>{[['Python','Demonstrated','strong'],['SQL','Partial match','partial'],['REST APIs','Missing','missing'],['React','Demonstrated','strong']].map(([skill,status,tone])=><div className="skill-row" key={skill}><b>{skill}</b><span className={`skill-state ${tone}`}>{status}</span><div className="mini-bar"><i style={{width:tone==='strong'?'90%':tone==='partial'?'55%':'15%'}} /></div></div>)}</section><section className="panel"><div className="panel-heading"><h3>Recommended learning path</h3><Upload size={18}/></div>{['REST API fundamentals','SQL joins and query practice','Build a React project'].map((x,i)=><div className="learning-row" key={x}><span>0{i+1}</span><div><b>{x}</b><small>{i===0?'4 hours · Beginner':'6 hours · Practice'}</small></div><button className="button secondary small">Start</button></div>)}</section></div></WorkspaceShell> }

function LearningWorkspace() { return <WorkspaceShell eyebrow="Learn what moves you forward" title="Learning Hub" description="Find resources connected to your current skill gaps and preferred learning style."><div className="learning-toolbar"><div className="input-with-icon"><Search size={16}/><input placeholder="Search skills, topics or resources" aria-label="Search learning resources"/></div><select aria-label="Filter by language"><option>All languages</option><option>English</option><option>हिन्दी — Hindi</option></select><select aria-label="Filter by level"><option>All levels</option><option>Beginner</option><option>Intermediate</option></select></div><div className="resource-list">{['Complete Python for Data Analysis','SQL for Beginners (Hindi)','Data Visualization with Power BI','REST API fundamentals'].map((x,i)=><article className="resource-row" key={x}><span className="resource-number">0{i+1}</span><div><b>{x}</b><small>{i===1?'Hindi · 6 hours':'English · '+(4+i)+' hours'} · Skill gap recommendation</small></div><span className="badge match">{i<2?'Recommended':'Saved'}</span><button className="button secondary small">Open resource</button></article>)}</div></WorkspaceShell> }

function CompetencyWorkspace() { return <WorkspaceShell eyebrow="Your evidence-based profile" title="Competency Profile" description="Track proficiency, evidence and progress across the capabilities employers value."><div className="competency-list">{[['Problem solving','Advanced','Project assessment'],['Python','Intermediate','Course + project'],['Communication','Intermediate','Interview practice'],['SQL','Beginner','Learning in progress']].map(([name,level,evidence])=><div className="competency-row" key={name}><div><b>{name}</b><small>{evidence}</small></div><span className="badge success">{level}</span><div className="competency-bar"><i style={{width:level==='Advanced'?'88%':level==='Intermediate'?'65%':'35%'}} /></div><button className="button secondary small">View evidence</button></div>)}</div></WorkspaceShell> }
