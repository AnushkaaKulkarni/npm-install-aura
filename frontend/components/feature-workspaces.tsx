'use client'



import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

import Link from 'next/link'



import { AudioLines, BarChart3, CheckCircle2, FileText,

  LoaderCircle, MessageCircle, Mic, MicOff, Play, Plus, Search, Send, Sparkles,

  Target, Trash2, Volume2, VolumeX, Upload,

} from 'lucide-react'

import { AiTutorSetup } from './ai-tutor/AiTutorSetup'

import { AiTutorSession } from './ai-tutor/AiTutorSession'

import type { TutorSessionConfig } from '@/lib/ai-tutor/types'

import { LearningWorkspace } from './learning-workspace'

import { apiRequest, type LearningResource } from '@/lib/api'



export function FeatureWorkspace({

  section,

  tutorSession,

}: {

  section: string

  tutorSession?: TutorSessionConfig

}) {

  if (section === 'AI Tutor') {

    return tutorSession

      ? <AiTutorSession config={tutorSession} />

      : <AiTutorSetup />

  }

  if (section === 'Interview Preparation') return <InterviewWorkspace />

  if (section === 'AI Career Assistant') return <AssistantWorkspace />

  if (section === 'Resume Studio') return <ResumeWorkspace />

  if (section === 'ATS Resume Analyzer') return <AtsWorkspace />

  if (section === 'Skill Gap Analysis') return <SkillGapWorkspace />

  if (section === 'Recommended Learning / Learning Hub') return <LearningWorkspace />

  if (section === 'Competency Profile') return <CompetencyWorkspace />

  return null

}



function WorkspaceShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {

  return <div className="feature-workspace"><div className="workspace-intro"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div><span className="workspace-status"><CheckCircle2 size={14} /> Demo workspace ready</span></div>{children}</div>

}



function InterviewWorkspace() { const [started, setStarted] = useState(false); return <WorkspaceShell eyebrow="Practice with purpose" title="Interview Preparation" description="Build confidence with role-specific practice, feedback and revision prompts."><div className="workspace-grid interview-grid"><section className="panel setup-panel"><div className="panel-heading"><h3>{started ? 'Live mock interview' : 'Set up your mock interview'}</h3><Target size={18}/></div>{started ? <><div className="interview-progress"><span>Question 2 of 8</span><b>25%</b></div><div className="question-card"><span className="eyebrow">Technical · Medium</span><h3>How would you validate an API response before storing it?</h3><textarea placeholder="Type your answer or use voice input..." aria-label="Interview answer"/><div className="workspace-actions"><button className="button secondary">Skip question</button><button className="button primary">Submit answer <Play size={14}/></button></div></div></> : <div className="selector-stack"><label>Target job<select><option>Software Developer (Fresher)</option><option>Data Analyst</option></select></label><label>Interview type<select><option>Technical</option><option>HR</option><option>Aptitude</option><option>Coding</option><option>Role-specific</option></select></label><div className="two-fields"><label>Difficulty<select><option>Medium</option><option>Easy</option><option>Hard</option></select></label><label>Duration<select><option>15 minutes</option><option>30 minutes</option></select></label></div><button className="button primary full" onClick={()=>setStarted(true)}>Start mock interview <Play size={14}/></button></div>}</section><section className="panel"><div className="panel-heading"><h3>Recent results</h3><BarChart3 size={18}/></div>{['Technical fundamentals','HR introduction','SQL practice'].map((item,i)=><div className="result-row" key={item}><div><b>{item}</b><small>{i===0?'Answer relevance 84%':i===1?'Communication 78%':'Needs revision'}</small></div><span className={i===2?'badge warning':'badge success'}>{i===2?'Review':'View report'}</span></div>)}</section></div></WorkspaceShell> }



type ChatMessage = { role: 'user' | 'assistant'; content: string; createdAt?: string }

type Conversation = { id: string; title: string; language: string; updatedAt: string; preview?: string; messages?: ChatMessage[] }

type CareerProfile = { skills: string[]; experience: string; targetRole: string; resumeSummary: string }



function inlineMarkdown(value: string, keyPrefix: string): ReactNode[] {

  const pattern = /(\*\*[^\*]+\*\*|__[^_]+__|\*[^\*\n]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g

  const parts = value.replace(/<br\s*\/?\s*>/gi, '\n').split(pattern)

  return parts.filter(Boolean).flatMap((part, index) => {

    const key = `${keyPrefix}-${index}`

    const strong = /^(\*\*|__)(.+)\1$/.exec(part)

    if (strong) return [<strong key={key}>{strong[2]}</strong>]

    const emphasis = /^\*([^\*]+)\*$/.exec(part)

    if (emphasis) return [<em key={key}>{emphasis[1]}</em>]

    const code = /^`([^`]+)`$/.exec(part)

    if (code) return [<code key={key}>{code[1]}</code>]

    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part)

    if (link) return [<a key={key} href={link[2]} target="\_blank" rel="noreferrer">{link[1]}</a>]

    return part.split('\n').flatMap((line, lineIndex) => lineIndex ? [<br key={`${key}-br-${lineIndex}`} />, line] : [line])

  })

}



function AssistantMarkdown({ content }: { content: string }) {

  const lines = content.replace(/\r/g, '').replace(/<br\s*\/?\s*>/gi, '\n').split('\n')

  const blocks: ReactNode[] = []

  let paragraph: string[] = []

  let index = 0

  const flushParagraph = () => {

    if (paragraph.length) blocks.push(<p key={`p-${index++}`}>{inlineMarkdown(paragraph.join(' '), `p-${index}`)}</p>)

    paragraph = []

  }

  while (index < lines.length) {

    const line = lines[index].trim()

    if (!line) { flushParagraph(); index++; continue }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line)

    if (heading) {

      flushParagraph()

      const level = Math.min(heading[1].length, 4)

      const text = inlineMarkdown(heading[2], `h-${index}`)

      if (level === 1) blocks.push(<h2 key={`h-${index}`}>{text}</h2>)

      else if (level === 2) blocks.push(<h3 key={`h-${index}`}>{text}</h3>)

      else blocks.push(<h4 key={`h-${index}`}>{text}</h4>)

      index++; continue

    }

    if (line.startsWith('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {

      flushParagraph()

      const parseRow = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim())

      const headers = parseRow(line)

      index += 2

      const rows: string[][] = []

      while (index < lines.length && lines[index].trim().startsWith('|')) rows.push(parseRow(lines[index++]))

      blocks.push(<div className="assistant-table-wrap" key={`table-${index}`}><table className="assistant-table"><thead><tr>{headers.map((cell, cellIndex) => <th key={cellIndex}>{inlineMarkdown(cell, `th-${index}-${cellIndex}`)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}>{inlineMarkdown(row[cellIndex] || '', `td-${index}-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody></table></div>)

      continue

    }

    const unordered = /^[-\*•]\s+(.+)$/.exec(line)

    const ordered = /^\d+[.)]\s+(.+)$/.exec(line)

    if (unordered || ordered) {

      flushParagraph()

      const isOrdered = Boolean(ordered)

      const items: string[] = []

      while (index < lines.length) {

        const itemLine = lines[index].trim()

        const match = isOrdered ? /^\d+[.)]\s+(.+)$/.exec(itemLine) : /^[-\*•]\s+(.+)$/.exec(itemLine)

        if (!match) break

        items.push(match[1]); index++

      }

      const itemNodes = items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `li-${index}-${itemIndex}`)}</li>)

      blocks.push(isOrdered ? <ol key={`list-${index}`}>{itemNodes}</ol> : <ul key={`list-${index}`}>{itemNodes}</ul>)

      continue

    }

    if (/^```/.test(line)) {

      flushParagraph(); index++

      const codeLines: string[] = []

      while (index < lines.length && !/^\s*```/.test(lines[index])) codeLines.push(lines[index++])

      index++

      blocks.push(<pre key={`code-${index}`}><code>{codeLines.join('\n')}</code></pre>)

      continue

    }

    paragraph.push(line); index++

  }

  flushParagraph()

  return <div className="assistant-markdown">{blocks}</div>

}



function speechLanguage(text: string, fallback: string): string {

  const languageByScript: Array<{ test: RegExp; code: string }> = [

    { test: /[\u0980-\u09FF]/, code: 'bn-IN' }, { test: /[\u0B80-\u0BFF]/, code: 'ta-IN' },

    { test: /[\u0C00-\u0C7F]/, code: 'te-IN' }, { test: /[\u0A80-\u0AFF]/, code: 'gu-IN' },

    { test: /[\u0C80-\u0CFF]/, code: 'kn-IN' }, { test: /[\u0600-\u06FF]/, code: 'ur-IN' },

    { test: /[\u0900-\u097F]/, code: 'hi-IN' },

  ]

  return languageByScript.find(item => item.test.test(text))?.code || assistantLanguages.find(item => item.name === fallback)?.code || 'en-IN'

}



const assistantLanguages = [

  { name: 'English', code: 'en-IN' }, { name: 'हिन्दी — Hindi', code: 'hi-IN' }, { name: 'বাংলা — Bengali', code: 'bn-IN' },

  { name: 'मराठी — Marathi', code: 'mr-IN' }, { name: 'தமிழ் — Tamil', code: 'ta-IN' }, { name: 'తెలుగు — Telugu', code: 'te-IN' },

  { name: 'ગુજરાતી — Gujarati', code: 'gu-IN' }, { name: 'اردو — Urdu', code: 'ur-IN' }, { name: 'ಕನ್ನಡ — Kannada', code: 'kn-IN' },

]



function AssistantWorkspace() {

  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')

  const [conversations, setConversations] = useState<Conversation[]>([])

  const [activeId, setActiveId] = useState('')

  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [message, setMessage] = useState('')

  const [language, setLanguage] = useState('English')

  const [loading, setLoading] = useState(false)

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState('')

  const [listening, setListening] = useState(false)

  const [speakReplies, setSpeakReplies] = useState(true)

  const [profile, setProfile] = useState<CareerProfile>({ skills: [], experience: '', targetRole: '', resumeSummary: '' })

  const [profileSaved, setProfileSaved] = useState(false)

  const [profileBusy, setProfileBusy] = useState(false)

  const transcriptRef = useRef('')

  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  const messagesRef = useRef<HTMLDivElement>(null)



  async function request(path: string, init?: RequestInit) {

    if (!api) throw new Error('Assistant API is not configured. Set NEXT_PUBLIC_API_URL in the frontend environment.')

    const response = await fetch(`${api}/assistant${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } })

    const result = await response.json().catch(() => ({}))

    if (!response.ok) throw new Error(result.error || 'The assistant request failed.')

    return result

  }



  async function refreshConversations(selectFirst = false) {

    const result = await request('/conversations')

    const rows: Conversation[] = result.conversations || []

    setConversations(rows)

    if (selectFirst && rows.length) await openConversation(rows[0].id)

    return rows

  }



  async function openConversation(id: string) {

    setLoading(true); setError('')

    try {

      const result = await request(`/conversations/${id}`)

      setActiveId(id); setMessages(result.conversation.messages || []); setLanguage(result.conversation.language || 'English')

    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load this conversation.') }

    finally { setLoading(false) }

  }



  useEffect(() => {

    refreshConversations(true).catch(e => setError(e instanceof Error ? e.message : 'Could not load conversations.'))

    request('/profile').then(result => setProfile(result.profile)).catch(e => setError(e instanceof Error ? e.message : 'Could not load profile context.'))

  }, [])

  useEffect(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight }, [messages, busy])



  async function newConversation() {

    setError(''); setLoading(true)

    try { const result = await request('/conversations', { method: 'POST', body: JSON.stringify({ language }) }); const conversation = result.conversation as Conversation; setConversations(rows => [conversation, ...rows]); setActiveId(conversation.id); setMessages([]) }

    catch (e) { setError(e instanceof Error ? e.message : 'Could not start a conversation.') }

    finally { setLoading(false) }

  }



  async function sendMessage(event?: FormEvent, value = message) {

    event?.preventDefault()

    const content = value.trim()

    if (!content || busy) return

    setMessage(''); setError(''); setBusy(true)

    const optimistic: ChatMessage[] = [...messages, { role: 'user', content }]

    setMessages(optimistic)

    try {

      const result = await request(activeId ? `/conversations/${activeId}/messages` : '/messages', { method: 'POST', body: JSON.stringify({ message: content, language }) })

      const conversation = result.conversation as Conversation

      setActiveId(conversation.id); setMessages(conversation.messages || [...optimistic, { role: 'assistant', content: result.reply }]);

      setConversations(rows => [conversation, ...rows.filter(row => row.id !== conversation.id)])

      if (speakReplies) speak(result.reply, assistantLanguages.find(item => item.code === speechLanguage(result.reply, language))?.name || language)

    } catch (e) { setMessages(messages); setError(e instanceof Error ? e.message : 'Could not get a response.') }

    finally { setBusy(false) }

  }



  async function removeConversation(id: string) {

    try { await request(`/conversations/${id}`, { method: 'DELETE' }); const remaining = conversations.filter(row => row.id !== id); setConversations(remaining); if (activeId === id) { setActiveId(''); setMessages([]); if (remaining[0]) await openConversation(remaining[0].id) } }

    catch (e) { setError(e instanceof Error ? e.message : 'Could not delete this conversation.') }

  }



  async function saveProfile(event: FormEvent) {

    event.preventDefault(); setProfileBusy(true); setProfileSaved(false); setError('')

    try {

      const result = await request('/profile', { method: 'PUT', body: JSON.stringify({ ...profile, skills: profile.skills.map(skill => skill.trim()).filter(Boolean) }) })

      setProfile(result.profile); setProfileSaved(true)

    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save career profile.') }

    finally { setProfileBusy(false) }

  }



  function speak(text: string, selectedLanguage = language) {

    if (!('speechSynthesis' in window)) { setError('Spoken replies are not supported by this browser.'); return }

    const voice = assistantLanguages.find(item => item.name === selectedLanguage)

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    utterance.lang = voice?.code || 'en-IN'; window.speechSynthesis.speak(utterance)

  }



  function toggleListening() {

    type RecognitionResultEvent = Event & { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }

    type Recognition = { lang: string; interimResults: boolean; onresult: ((event: RecognitionResultEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void }

    const SpeechRecognitionAPI = (window as Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) { setError('Voice input is not supported in this browser. Try Chrome or Edge.'); return }

    if (listening) { recognitionRef.current?.stop(); setListening(false); return }

    const recognition = new SpeechRecognitionAPI()

    recognition.lang = assistantLanguages.find(item => item.name === language)?.code || 'en-IN'; recognition.interimResults = true

    recognition.onresult = event => { let finalText = ''; let interim = ''; for (let i = event.resultIndex; i < event.results.length; i++) { if (event.results[i].isFinal) finalText += event.results[i][0].transcript; else interim += event.results[i][0].transcript } transcriptRef.current = finalText || interim; setMessage(transcriptRef.current) }

    recognition.onerror = () => { setListening(false); setError('Could not capture audio. Check microphone access and try again.') }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition; recognition.start(); setListening(true)

  }



  return <WorkspaceShell eyebrow="Guidance when you need it" title="AI Career Assistant" description="Get profile-aware help with job search, interview preparation, learning paths and skill gaps."><div className="assistant-tools"><label>Reply language<select value={language} onChange={e => setLanguage(e.target.value)}>{assistantLanguages.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label><span><AudioLines size={15}/> Replies follow your message language automatically. Voice controls use your browser and device.</span><details className="career-profile-editor"><summary>Update career context</summary><form onSubmit={saveProfile}><label>Target role<input value={profile.targetRole} maxLength={160} onChange={e=>setProfile({...profile,targetRole:e.target.value})} placeholder="e.g. Junior Data Analyst"/></label><label>Skills, separated by commas<input value={profile.skills.join(', ')} onChange={e=>setProfile({...profile,skills:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})} placeholder="SQL, Excel, Python"/></label><label>Experience<textarea value={profile.experience} maxLength={2000} onChange={e=>setProfile({...profile,experience:e.target.value})} placeholder="Experience, projects, internships…"/></label><label>Resume summary<textarea value={profile.resumeSummary} maxLength={4000} onChange={e=>setProfile({...profile,resumeSummary:e.target.value})} placeholder="A short summary or paste relevant resume details"/></label><div className="profile-save-row"><button className="button primary" disabled={profileBusy}>{profileBusy?'Saving…':'Save career context'}</button>{profileSaved&&<small>Saved to your account</small>}</div></form></details></div><div className="assistant-workspace"><aside className="panel conversation-list"><div className="panel-heading"><h3>Conversations</h3><button className="icon-button" type="button" onClick={newConversation} aria-label="New conversation"><Plus size={18}/></button></div><button className="button secondary full" onClick={newConversation}><Plus size={15}/> New conversation</button>{conversations.map(row=><div className={activeId===row.id?'conversation active':'conversation'} key={row.id}><button onClick={()=>openConversation(row.id)}>{row.title}<small>{new Date(row.updatedAt).toLocaleDateString()}</small></button><button className="delete-conversation" onClick={()=>removeConversation(row.id)} aria-label={`Delete ${row.title}`}><Trash2 size={14}/></button></div>)}{!conversations.length&&!loading&&<p className="conversation-empty">Your saved conversations will appear here.</p>}</aside><section className="panel conversation-panel"><div className="context-strip"><Sparkles size={16}/> Personalization uses your saved target role, skills, experience and resume summary. Missing details are requested, not guessed.</div><div className="messages" ref={messagesRef} aria-live="polite">{!messages.length&&<div className="assistant-welcome"><span><Sparkles size={23}/></span><h3>How can I help with your career?</h3><p>Ask about a role, interview practice, learning plan, or what information you need to identify skill gaps.</p></div>}{messages.map((item,index)=><div className={`message ${item.role}`} key={`${index}-${item.createdAt || item.content.slice(0,16)}`}>{item.role==='assistant'?<AssistantMarkdown content={item.content}/>:<p>{item.content}</p>}{item.role==='assistant'&&<button className="speak-message" onClick={()=>speak(item.content,assistantLanguages.find(option=>option.code===speechLanguage(item.content,language))?.name||language)} aria-label="Read response aloud"><Volume2 size={14}/> Listen</button>}</div>)}{busy&&<div className="message assistant"><LoaderCircle className="spin" size={16}/> Thinking…</div>}</div><div className="suggested-prompts">{['What am I lacking for my target role?','Help me prepare for an interview','Build a learning plan for my goal'].map(prompt=><button type="button" key={prompt} onClick={()=>sendMessage(undefined,prompt)}>{prompt}</button>)}</div>{error&&<p className="assistant-error" role="alert">{error}</p>}<form className="composer" onSubmit={e=>sendMessage(e)}><button type="button" className={listening?'voice-button listening':'voice-button'} onClick={toggleListening} aria-label={listening?'Stop recording':'Start voice input'} title={listening?'Stop recording':'Start voice input'}>{listening?<MicOff size={18}/>:<Mic size={18}/>}</button><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask your career assistant…" aria-label="Message" disabled={busy}/><button type="button" className="voice-button" onClick={()=>setSpeakReplies(!speakReplies)} aria-label={speakReplies?'Turn off spoken replies':'Turn on spoken replies'} title={speakReplies?'Spoken replies on':'Spoken replies off'}>{speakReplies?<Volume2 size={18}/>:<VolumeX size={18}/>}</button><button className="button primary" type="submit" disabled={busy||!message.trim()}><Send size={15}/> Send</button></form></section></div></WorkspaceShell>

}



function ResumeWorkspace() { return <WorkspaceShell eyebrow="Shape your story" title="Resume Studio" description="Edit targeted resume sections and compare improvements against your chosen opportunity."><div className="workspace-grid resume-grid"><section className="panel editor-panel"><div className="panel-heading"><h3>Resume sections</h3><FileText size={18}/></div>{['Professional summary','Skills','Experience','Education','Projects'].map((x,i)=><div className="resume-section" key={x}><div><b>{x}</b><small>{i===0?'Strong opening for this role':i===1?'4 relevant skills detected':'Ready to edit'}</small></div><button className="button secondary small">Edit</button></div>)}<button className="button primary full">Preview resume</button></section><section className="panel comparison-panel"><div className="panel-heading"><h3>Suggested improvement</h3><Sparkles size={18}/></div><span className="eyebrow">Before</span><p className="comparison before">Worked on web projects and learned programming.</p><span className="eyebrow">After</span><p className="comparison after">Built responsive React applications and integrated REST APIs with measurable performance improvements.</p><div className="workspace-actions"><button className="button secondary">Target job: Software Developer</button><button className="button primary">Export PDF</button></div></section></div></WorkspaceShell> }



function AtsWorkspace() { return <WorkspaceShell eyebrow="Understand your match" title="ATS Resume Analyzer" description="See how your resume covers the target role and which changes can improve compatibility."><div className="workspace-grid ats-grid"><section className="panel score-panel"><span className="eyebrow">Estimated compatibility</span><div className="big-score">78<span>/100</span></div><p>Good foundation. Add evidence for two role requirements to strengthen your match.</p><div className="score-bar"><i style={{width:'78%'}} /></div></section><section className="panel checklist-panel"><div className="panel-heading"><h3>Prioritized checklist</h3><CheckCircle2 size={18}/></div>{['Add REST API project evidence','Mention SQL joins in skills','Use measurable impact in experience','Keep section headings consistent'].map((x,i)=><div className="checklist-row" key={x}><span>{i+1}</span><div><b>{x}</b><small>{i<2?'High priority':'Recommended'}</small></div></div>)}</section></div></WorkspaceShell> }



function SkillGapWorkspace() {

  const [recommendations, setRecommendations] = useState<LearningResource[]>([])



  useEffect(() => {

    let active = true

    apiRequest<{ recommendations: LearningResource[] }>('/resources/recommendations?targetRole=Software Developer (Fresher)')

      .then((data) => {

        if (active) setRecommendations(data.recommendations || [])

      })

      .catch(() => {})

    return () => {

      active = false

    }

  }, [])



  return (

    <WorkspaceShell

      eyebrow="Make the next step clear"

      title="Skill Gap Analysis"

      description="Compare your demonstrated skills with what the target opportunity asks for."

    >

      <div className="workspace-grid skill-gap-grid">

        <section className="panel">

          <div className="panel-heading">

            <h3>Software Developer (Fresher)</h3>

            <Target size={18} />

          </div>

          {[

            ['Python', 'Demonstrated', 'strong'],

            ['SQL', 'Partial match', 'partial'],

            ['REST APIs', 'Missing', 'missing'],

            ['React', 'Demonstrated', 'strong'],

          ].map(([skill, status, tone]) => (

            <div className="skill-row" key={skill}>

              <b>{skill}</b>

              <span className={`skill-state ${tone}`}>{status}</span>

              <div className="mini-bar">

                <i style={{ width: tone === 'strong' ? '90%' : tone === 'partial' ? '55%' : '15%' }} />

              </div>

            </div>

          ))}

        </section>



        <section className="panel">

          <div className="panel-heading">

            <h3>Recommended learning path</h3>

            <Link href="/candidate/learning" style={{ fontSize: '11px', color: 'var(--blue)', textDecoration: 'none' }}>

              Learning Hub →

            </Link>

          </div>

          <div style={{ display: 'grid', gap: '8px' }}>

            {recommendations.slice(0, 4).map((rec, i) => (

              <div className="learning-row" key={rec.id || i}>

                <span>0{i + 1}</span>

                <div style={{ flex: 1 }}>

                  <b>{rec.title}</b>

                  <small>

                    {rec.difficulty} · {rec.durationMinutes} mins · {rec.recommendationReason || 'Skill gap recommendation'}

                  </small>

                </div>

                <Link href="/candidate/learning" className="button secondary small">

                  Start

                </Link>

              </div>

            ))}

            {recommendations.length === 0 && (

              <p style={{ color: 'var(--muted)', fontSize: '11px' }}>Loading learning recommendations...</p>

            )}

          </div>

        </section>

      </div>

    </WorkspaceShell>

  )

}



function CompetencyWorkspace() { return <WorkspaceShell eyebrow="Your evidence-based profile" title="Competency Profile" description="Track proficiency, evidence and progress across the capabilities employers value."><div className="competency-list">{[['Problem solving','Advanced','Project assessment'],['Python','Intermediate','Course + project'],['Communication','Intermediate','Interview practice'],['SQL','Beginner','Learning in progress']].map(([name,level,evidence])=><div className="competency-row" key={name}><div><b>{name}</b><small>{evidence}</small></div><span className="badge success">{level}</span><div className="competency-bar"><i style={{width:level==='Advanced'?'88%':level==='Intermediate'?'65%':'35%'}} /></div><button className="button secondary small">View evidence</button></div>)}</div></WorkspaceShell> }
