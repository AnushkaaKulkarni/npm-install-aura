'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, Download, LoaderCircle, Pause, Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import { createTutorSession } from '@/lib/ai-tutor/api'
import { downloadTutorNotesPdf } from '@/lib/ai-tutor/pdfNotes'
import type { TutorLesson, TutorSessionConfig } from '@/lib/ai-tutor/types'
import { TutorAvatar } from './TutorAvatar'

type SpeechSegment = { heading: string; text: string }
type VoiceWindow = Window & { webkitSpeechSynthesis?: SpeechSynthesis }
const languageCodes: Record<TutorLesson['language'], string> = { English: 'en-IN', Hindi: 'hi-IN', Marathi: 'mr-IN' }
const lessonLabels: Record<TutorLesson['language'], { introduction: string; concepts: string; examples: string; summary: string; details: string }> = {
  English: { introduction: 'Introduction', concepts: 'Key concepts and definitions', examples: 'Examples', summary: 'Summary', details: 'AI Tutor lesson' },
  Hindi: { introduction: 'परिचय', concepts: 'मुख्य अवधारणाएँ और परिभाषाएँ', examples: 'उदाहरण', summary: 'सारांश', details: 'AI Tutor पाठ' },
  Marathi: { introduction: 'परिचय', concepts: 'मुख्य संकल्पना आणि व्याख्या', examples: 'उदाहरणे', summary: 'सारांश', details: 'AI Tutor धडा' },
}

function toSentences(text: string): string[] {
  return text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?।॥])\s+/u).filter(Boolean)
}

function lessonScript(lesson: TutorLesson): SpeechSegment[] {
  const labels = lessonLabels[lesson.language]
  const segments: SpeechSegment[] = []
  const add = (heading: string, text: string) => toSentences(text).forEach(sentence => segments.push({ heading, text: sentence }))
  add(labels.introduction, lesson.introduction)
  lesson.sections.forEach(section => add(section.heading, section.narration))
  lesson.concepts.forEach(concept => add(labels.concepts, `${concept.term}. ${concept.definition}`))
  lesson.examples.forEach(example => add(labels.examples, example))
  add(labels.summary, lesson.summary)
  return segments
}

function ProgressiveLine({ text, boundary, active }: { text: string; boundary: number; active: boolean }) {
  const visibleEnd = active ? Math.max(0, Math.min(text.length, boundary)) : text.length
  const visible = text.slice(0, visibleEnd)
  const tokens = visible.split(/(\s+)/)
  let position = 0
  return <span>{tokens.map((token, index) => {
    const start = position
    position += token.length
    if (!token || /^\s+$/.test(token)) return <span key={index}>{token}</span>
    const highlighted = active && boundary >= start && boundary <= position
    return <span className={highlighted ? 'tutor-current-word' : undefined} key={index}>{token}</span>
  })}</span>
}

export function AiTutorSession({ config }: { config: TutorSessionConfig }) {
  const [lesson, setLesson] = useState<TutorLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(config.duration * 60)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [speechActive, setSpeechActive] = useState(false)
  const [speechDone, setSpeechDone] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [rate, setRate] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [charPosition, setCharPosition] = useState(0)
  const [voiceNotice, setVoiceNotice] = useState('')
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const segments = useMemo(() => lesson ? lessonScript(lesson) : [], [lesson])
  const segmentsRef = useRef<SpeechSegment[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const utteranceIdRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const boundaryFallbackRef = useRef<number | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    createTutorSession(config).then(result => { if (active) setLesson(result) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to generate this lesson.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [config.topic, config.language, config.duration])

  useEffect(() => { segmentsRef.current = segments }, [segments])
  useEffect(() => {
    const synth = window.speechSynthesis || (window as VoiceWindow).webkitSpeechSynthesis
    if (!synth) return
    const update = () => setVoices(synth.getVoices())
    update()
    synth.addEventListener?.('voiceschanged', update)
    return () => synth.removeEventListener?.('voiceschanged', update)
  }, [])
  useEffect(() => {
    if (!started || paused || sessionEnded || remaining <= 0) return
    timerRef.current = window.setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000)
    return () => { if (timerRef.current !== null) window.clearInterval(timerRef.current); timerRef.current = null }
  }, [started, paused, sessionEnded, remaining <= 0])
  useEffect(() => {
    if (remaining !== 0 || !started) return
    const synth = window.speechSynthesis || (window as VoiceWindow).webkitSpeechSynthesis
    synth?.cancel()
    utteranceIdRef.current++
    setSpeechActive(false); setPaused(true); setSessionEnded(true)
  }, [remaining, started])
  useEffect(() => {
    if (boardRef.current) boardRef.current.scrollTop = boardRef.current.scrollHeight
  }, [currentIndex, charPosition])
  useEffect(() => () => {
    const synth = window.speechSynthesis || (window as VoiceWindow).webkitSpeechSynthesis
    synth?.cancel()
    utteranceIdRef.current++
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    if (boundaryFallbackRef.current !== null) window.clearTimeout(boundaryFallbackRef.current)
  }, [])

  function speakAt(index: number, offset = 0, selectedRate = rate): boolean {
    const synth = window.speechSynthesis || (window as VoiceWindow).webkitSpeechSynthesis
    const revealLessonWithoutVoice = (notice: string) => {
      const lastIndex = Math.max(0, segmentsRef.current.length - 1)
      setVoiceNotice(notice); setSpeechDone(true); setCurrentIndex(lastIndex)
      setCharPosition(segmentsRef.current[lastIndex]?.text.length || 0); setPaused(true)
    }
    if (!synth) { revealLessonWithoutVoice('Speech synthesis is not supported in this browser. The complete lesson and notes are available to read.'); return false }
    const languageCode = languageCodes[config.language]
    const voice = voices.find(item => item.lang.toLowerCase() === languageCode.toLowerCase()) || voices.find(item => item.lang.toLowerCase().startsWith(languageCode.slice(0, 2).toLowerCase()))
    if (!voice) {
      revealLessonWithoutVoice(`This device does not have a ${config.language} speech voice installed. The complete lesson is available to read; install a ${config.language} voice in your device settings to hear it.`)
      return false
    }
    const segment = segmentsRef.current[index]
    if (!segment) return false
    synth.cancel()
    const utteranceId = ++utteranceIdRef.current
    const utterance = new SpeechSynthesisUtterance(segment.text.slice(offset))
    utterance.lang = languageCode; utterance.voice = voice; utterance.rate = selectedRate
    setCurrentIndex(index); setCharPosition(offset); setVoiceNotice('')
    let receivedBoundary = false
    utterance.onstart = () => {
      if (utteranceId !== utteranceIdRef.current) return
      setSpeechActive(true)
      boundaryFallbackRef.current = window.setTimeout(() => {
        if (!receivedBoundary && utteranceId === utteranceIdRef.current) setCharPosition(segment.text.length)
      }, 180)
    }
    utterance.onboundary = event => {
      if (utteranceId !== utteranceIdRef.current || event.name !== 'word') return
      receivedBoundary = true
      if (boundaryFallbackRef.current !== null) window.clearTimeout(boundaryFallbackRef.current)
      const wordLength = event.charLength || segment.text.slice(offset + event.charIndex).match(/^\S+/)?.[0].length || 1
      setCurrentIndex(index); setCharPosition(Math.min(segment.text.length, offset + event.charIndex + wordLength))
    }
    utterance.onend = () => {
      if (utteranceId !== utteranceIdRef.current) return
      if (boundaryFallbackRef.current !== null) window.clearTimeout(boundaryFallbackRef.current)
      setSpeechActive(false)
      if (index + 1 < segmentsRef.current.length) speakAt(index + 1, 0, selectedRate)
      else { setSpeechDone(true); setCurrentIndex(segmentsRef.current.length - 1); setCharPosition(segmentsRef.current.at(-1)?.text.length || 0) }
    }
    utterance.onerror = event => {
      if (utteranceId !== utteranceIdRef.current || event.error === 'canceled' || event.error === 'interrupted') return
      setSpeechActive(false); setPaused(true); setVoiceNotice('Speech playback stopped. Check your device audio settings and press Play to continue.')
    }
    utteranceRef.current = utterance
    synth.speak(utterance)
    return true
  }

  function togglePlayback() {
    if (!lesson || sessionEnded) return
    const synth = window.speechSynthesis || (window as VoiceWindow).webkitSpeechSynthesis
    if (started && !paused) {
      synth?.pause(); setSpeechActive(false); setPaused(true); return
    }
    if (started && paused) {
      setPaused(false)
      if (speechDone) return
      if (synth?.paused && utteranceRef.current) { synth.resume(); setSpeechActive(true); return }
      if (!speakAt(currentIndex, charPosition, rate)) setPaused(true)
      return
    }
    setStarted(true); setPaused(false)
    if (!speakAt(currentIndex, charPosition, rate)) setPaused(true)
  }

  function changeRate(nextRate: number) {
    setRate(nextRate)
    if (started && !speechDone && lesson) {
      const synth = window.speechSynthesis || (window as VoiceWindow).webkitSpeechSynthesis
      synth?.cancel(); utteranceIdRef.current++
      utteranceRef.current = null
      if (!paused) window.setTimeout(() => speakAt(currentIndex, charPosition, nextRate), 80)
    }
  }

  function replayLesson() {
    if (!lesson || sessionEnded) return
    setStarted(true); setPaused(false); setSpeechDone(false); setCurrentIndex(0); setCharPosition(0)
    speakAt(0, 0, rate)
  }

  async function downloadNotes() {
    if (!lesson || notesLoading) return
    setNotesError('')
    setNotesLoading(true)
    try {
      await downloadTutorNotesPdf(lesson)
    } catch (reason) {
      setNotesError(reason instanceof Error ? reason.message : 'Unable to generate the PDF. Please try again.')
    } finally {
      setNotesLoading(false)
    }
  }

  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0')
  const seconds = (remaining % 60).toString().padStart(2, '0')
  const lessonComplete = Boolean(lesson?.sections.length && lesson.concepts.length && lesson.examples.length && lesson.summary)
  const hasStartedText = started && (speechActive || speechDone || charPosition > 0 || currentIndex > 0)
  const visibleSegments = lesson && hasStartedText ? segments.slice(0, Math.min(segments.length, currentIndex + 1)) : []

  return <div className="ai-tutor-page ai-tutor-session-page">
    <header className="tutor-session-heading"><div><Link href="/candidate/ai-tutor" className="tutor-back-link"><ArrowLeft size={16}/> Setup</Link><h1>{lesson?.topic || config.topic}</h1><p>{config.language} lesson <span>·</span> {config.duration} minutes</p></div><div className={`tutor-timer ${remaining < 60 ? 'timer-ending' : ''}`} aria-live="polite"><span>TIME LEFT</span><strong>{minutes}:{seconds}</strong></div></header>
    {loading ? <div className="panel tutor-loading"><LoaderCircle className="tutor-spin" size={28}/><h2>Preparing your lesson…</h2><p>Building the explanation, key concepts, examples, and notes.</p></div> : error ? <div className="panel tutor-session-error"><h2>We couldn’t start this session</h2><p role="alert">{error}</p><Link className="button secondary" href="/candidate/ai-tutor"><ArrowLeft size={16}/> Back to setup</Link></div> : lesson ? <>
      <div className="tutor-session-grid">
        <section className="panel tutor-video-panel"><TutorAvatar speaking={speechActive}/><div className="tutor-video-caption"><span className={speechActive?'speaking-dot':'ready-dot'}/>{sessionEnded?'Session complete':speechActive?'Tutor is speaking':speechDone?'Explanation complete':started&&paused?'Paused':'Ready when you are'}</div><div className="tutor-video-topic"><span><Sparkles size={15}/> TODAY’S LESSON</span><h2>{lesson.topic}</h2><small>{lesson.wordCount.toLocaleString()} words prepared</small></div></section>
        <section className="panel tutor-whiteboard-panel"><div className="whiteboard-heading"><div><span className="eyebrow">LIVE WHITEBOARD</span><h2>{visibleSegments[currentIndex]?.heading || 'Your lesson'}</h2></div><span className="whiteboard-language">{lesson.language}</span></div><div className="tutor-whiteboard" ref={boardRef} aria-live="polite">{visibleSegments.length ? visibleSegments.map((segment,index)=><div className={`whiteboard-line ${index===currentIndex&&!speechDone?'current-line':''}`} key={`${index}-${segment.heading}`}><span className="whiteboard-marker">{index < currentIndex || speechDone?<CheckCircle2 size={15}/>:<i/>}</span><p><small>{segment.heading}</small><br/><ProgressiveLine text={segment.text} boundary={index===currentIndex?charPosition:segment.text.length} active={index===currentIndex&&!speechDone}/></p></div>) : <div className="whiteboard-empty"><Sparkles size={24}/><p>Press play to begin your lesson.</p></div>}{speechDone&&<div className="lesson-read-complete"><CheckCircle2 size={17}/> You’ve heard the complete explanation. Review it while your session timer runs.</div>}</div><div className="tutor-playback-controls"><div className="primary-controls"><button type="button" className="tutor-play-button" onClick={togglePlayback} disabled={!lessonComplete||sessionEnded} aria-label={started&&!paused?'Pause session':'Play lesson'}>{started&&!paused?<Pause size={19} fill="currentColor"/>:<Play size={19} fill="currentColor"/>}<span>{sessionEnded?'Session complete':started&&!paused?'Pause session':paused?'Resume lesson':speechDone?'Continue session':'Play lesson'}</span></button><button type="button" className="tutor-replay-button" onClick={replayLesson} disabled={!lessonComplete||sessionEnded} aria-label="Replay lesson"><RotateCcw size={17}/> Replay</button></div><div className="tutor-speed-control" role="group" aria-label="Speech playback speed">{[0.5,1,2].map(value=><button type="button" key={value} className={rate===value?'selected':''} onClick={()=>changeRate(value)} disabled={!lessonComplete}>{value}×</button>)}</div></div></section>
      </div>
      <div className="tutor-session-footer">{voiceNotice&&<p className="tutor-voice-notice" role="status"><Volume2 size={16}/>{voiceNotice}</p>}{sessionEnded&&<p className="tutor-complete-notice"><CheckCircle2 size={17}/> Your {config.duration}-minute learning session is complete.</p>}{notesError&&<p className="tutor-voice-notice" role="alert">{notesError}</p>}<button type="button" className="button primary tutor-download-button" onClick={() => void downloadNotes()} disabled={!lessonComplete||notesLoading} aria-busy={notesLoading}>{notesLoading?<LoaderCircle size={17} className="tutor-spin"/>:<Download size={17}/>} {notesLoading?'Generating PDF…':'Download Notes as PDF'}</button></div>
    </> : null}
  </div>
}
