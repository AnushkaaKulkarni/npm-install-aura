'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  AlertCircle, ArrowRight, Camera, CameraOff, CheckCircle2, Clock3, LoaderCircle,
  Mic, MicOff, PhoneOff, Play, RotateCcw, Square, Volume2,
} from 'lucide-react'

type Feedback = {
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
  sampleAnswer: string
  dimensions: Record<'technicalAccuracy' | 'communicationClarity' | 'answerRelevance' | 'problemSolving' | 'completeness', number>
}
type InterviewQuestion = {
  question: string
  category: string
  originalTranscript?: string
  editedTranscript?: string
  audioMimeType?: string
  recordingDurationMs?: number
  feedback?: Feedback
}
type InterviewReport = {
  overallScore: number | null
  dimensions: Record<'technicalAccuracy' | 'communicationClarity' | 'answerRelevance' | 'problemSolving' | 'completeness', number | null>
  strengths: string[]
  weaknesses: string[]
  knowledgeGaps: string[]
  improvedAnswerOutlines: string[]
  practiceRecommendations: string[]
  confidenceEstimate: number | null
  confidenceNote: string
}
type InterviewSession = {
  id: string
  jobRole: string
  interviewType: string
  difficulty: string
  durationMinutes: number
  totalQuestions: number
  currentQuestionIndex: number
  questions: InterviewQuestion[]
  status: 'active' | 'completed' | 'ended'
  report: InterviewReport | null
  startedAt: string
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  length: number
  [index: number]: { transcript: string }
}
type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

const dimensionLabels: Array<[keyof InterviewReport['dimensions'], string]> = [
  ['technicalAccuracy', 'Technical knowledge & accuracy'],
  ['communicationClarity', 'Communication clarity'],
  ['answerRelevance', 'Answer relevance'],
  ['problemSolving', 'Problem-solving & reasoning'],
  ['completeness', 'Completeness'],
]

async function interviewRequest<T>(path: string, method: 'GET' | 'POST' = 'GET', payload?: unknown): Promise<T> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
  if (!apiBase) throw new Error('The API is not configured. Set NEXT_PUBLIC_API_URL and try again.')
  let response: Response
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      credentials: 'include',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
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

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function InterviewProgress({ session }: { session: InterviewSession }) {
  return <div className="video-interview-progress">
    <div className="video-interview-progress-label"><span>Question {session.currentQuestionIndex + 1} / {session.totalQuestions}</span><b>{Math.round(((session.currentQuestionIndex + 1) / session.totalQuestions) * 100)}%</b></div>
    <div className="video-interview-progress-track"><i style={{ width: `${((session.currentQuestionIndex + 1) / session.totalQuestions) * 100}%` }}/></div>
  </div>
}

export function InterviewSessionRoom({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const speechRecognitionShouldRunRef = useRef(false)
  const speechRecognitionBaseRef = useRef('')
  const speechFinalTranscriptRef = useRef('')
  const chunksRef = useRef<BlobPart[]>([])
  const recordingStartedAt = useRef(0)
  const activeQuestionIndex = useRef(0)
  const finishing = useRef(false)
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [microphoneOn, setMicrophoneOn] = useState(true)
  const [recording, setRecording] = useState(false)
  const [recordingStarting, setRecordingStarting] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [speechRecognitionMessage, setSpeechRecognitionMessage] = useState('')
  const [transcript, setTranscript] = useState('')
  const [originalTranscript, setOriginalTranscript] = useState('')
  const [audioMimeType, setAudioMimeType] = useState('')
  const [recordingDurationMs, setRecordingDurationMs] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingAnswer, setSavingAnswer] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [timerReady, setTimerReady] = useState(false)
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')
  const question = session?.questions[session.currentQuestionIndex]

  const updateSession = useCallback(async () => {
    const result = await interviewRequest<{ session: InterviewSession }>(`/interviews/sessions/${sessionId}`)
    setSession(result.session)
    activeQuestionIndex.current = result.session.currentQuestionIndex
    const current = result.session.questions[result.session.currentQuestionIndex]
    setTranscript(current?.editedTranscript || '')
    setOriginalTranscript(current?.originalTranscript || '')
    setAudioMimeType(current?.audioMimeType || '')
    setRecordingDurationMs(current?.recordingDurationMs || 0)
    setFeedback(current?.feedback || null)
    return result.session
  }, [sessionId])

  useEffect(() => {
    let active = true
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true }).then(stream => {
      if (!active) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = stream
      setCameraReady(true)
      setCameraError('')
      if (videoRef.current) videoRef.current.srcObject = stream
    }).catch(reason => {
      if (active) setCameraError(reason instanceof Error ? reason.message : 'Camera or microphone access was denied. You can still type an answer.')
    })
    if (!navigator.mediaDevices?.getUserMedia) setCameraError('This browser does not support camera and microphone access. You can still type an answer.')
    updateSession().then(result => {
      if (!active) return
      if (result.status !== 'active' && result.report) {
        router.replace(`/candidate/interview-prep/results/${sessionId}`)
        return
      }
    }).catch(reason => {
      if (active) setError(errorText(reason, 'Unable to load this interview session.'))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
      window.speechSynthesis?.cancel()
      stopLiveSpeechRecognition()
      streamRef.current?.getTracks().forEach(track => track.stop())
      recordingStreamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [router, sessionId, updateSession])

  useEffect(() => {
    if (cameraReady && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current
  }, [cameraReady, loading])

  useEffect(() => {
    if (!session || session.status !== 'active') return
    const secondsElapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    setRemainingSeconds(Math.max(0, session.durationMinutes * 60 - secondsElapsed))
    setTimerReady(true)
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
      setRemainingSeconds(Math.max(0, session.durationMinutes * 60 - elapsed))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [session?.id, session?.startedAt, session?.durationMinutes, session?.status])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartedAt.current) / 1000)
      setRecordingSeconds(elapsed)
      if (elapsed >= 120 && recorderRef.current?.state === 'recording') {
        stopLiveSpeechRecognition()
        recorderRef.current.stop()
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    if (!question) return
    setTranscript(question.editedTranscript || '')
    setOriginalTranscript(question.originalTranscript || '')
    setFeedback(question.feedback || null)
  }, [question?.question, question?.feedback])

  function stopLiveSpeechRecognition() {
    speechRecognitionShouldRunRef.current = false
    const recognition = speechRecognitionRef.current
    if (!recognition) return
    try {
      recognition.stop()
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'InvalidStateError')) throw reason
    }
  }

  function startLiveSpeechRecognition() {
    const speechWindow = window as SpeechRecognitionWindow
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Recognition) {
      setSpeechRecognitionMessage('Live speech-to-text is not supported by this browser. You can type your answer below.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = navigator.language || 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    speechRecognitionRef.current = recognition
    speechRecognitionShouldRunRef.current = true
    speechRecognitionBaseRef.current = speechFinalTranscriptRef.current
    setSpeechRecognitionMessage('Live speech-to-text is on (browser speech recognition, not Gemini).')

    recognition.onresult = event => {
      let finalText = speechRecognitionBaseRef.current
      let interimText = ''
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        const text = result[0].transcript.trim()
        if (!text) continue
        if (result.isFinal) finalText = `${finalText}${finalText ? ' ' : ''}${text}`
        else interimText = `${interimText}${interimText ? ' ' : ''}${text}`
      }
      speechFinalTranscriptRef.current = finalText
      setOriginalTranscript(finalText)
      setTranscript(`${finalText}${interimText ? `${finalText ? ' ' : ''}${interimText}` : ''}`)
    }

    recognition.onerror = event => {
      if (event.error === 'no-speech') {
        setSpeechRecognitionMessage('Listening for speech… If no words appear, check your microphone or type your answer.')
        return
      }
      speechRecognitionShouldRunRef.current = false
      const message = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'Allow speech recognition in your browser to see words as you speak, or type your answer below.'
        : event.error === 'network'
          ? 'The browser speech service is unavailable. You can continue recording and type your answer.'
          : 'Live speech recognition stopped. You can continue recording and type your answer.'
      setSpeechRecognitionMessage(message)
    }

    recognition.onend = () => {
      if (speechRecognitionRef.current !== recognition) return
      if (!speechRecognitionShouldRunRef.current) {
        setOriginalTranscript(speechFinalTranscriptRef.current)
        setTranscript(speechFinalTranscriptRef.current)
        speechRecognitionRef.current = null
        return
      }
      speechRecognitionBaseRef.current = speechFinalTranscriptRef.current
      window.setTimeout(() => {
        if (!speechRecognitionShouldRunRef.current || speechRecognitionRef.current !== recognition) return
        try {
          recognition.start()
        } catch {
          speechRecognitionShouldRunRef.current = false
          setSpeechRecognitionMessage('Live speech recognition stopped. You can continue recording and type your answer.')
        }
      }, 150)
    }

    try {
      recognition.start()
    } catch {
      speechRecognitionShouldRunRef.current = false
      speechRecognitionRef.current = null
      setSpeechRecognitionMessage('Could not start live speech recognition. You can continue recording and type your answer.')
    }
  }

  async function startRecording() {
    if (!streamRef.current || !cameraReady) {
      setError('Camera and microphone are not available. Type your answer below instead.')
      return
    }
    if (!microphoneOn) {
      setError('Turn on your microphone before recording, or type your answer below.')
      return
    }
    if (recordingStarting || (recorderRef.current && ['recording', 'paused'].includes(recorderRef.current.state))) {
      setError('A recording is already in progress. Stop it before starting another answer.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot access a microphone. Type your answer below instead.')
      return
    }

    setRecordingStarting(true)
    setError('')
    let audioStream: MediaStream | null = null
    try {
      if (typeof MediaRecorder === 'undefined') throw new Error('Audio recording is not supported by this browser.')
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      })
      const audioTracks = audioStream.getAudioTracks().filter(track => track.readyState === 'live')
      if (!audioTracks.length) throw new Error('No active microphone was found. Check microphone access and try again.')
      audioTracks.forEach(track => { track.enabled = microphoneOn })

      const supportedTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .filter(type => typeof MediaRecorder.isTypeSupported !== 'function' || MediaRecorder.isTypeSupported(type))
      const recorderTypes: Array<string | undefined> = [...supportedTypes, undefined]
      let recorder: MediaRecorder | null = null
      let lastError: unknown
      for (const candidateType of recorderTypes) {
        try {
          const candidate = new MediaRecorder(audioStream, candidateType ? { mimeType: candidateType } : undefined)
          recorder = candidate
          break
        } catch (reason) {
          lastError = reason
        }
      }
      if (!recorder) throw lastError instanceof Error ? lastError : new Error('The browser could not create an audio recorder.')

      recorderRef.current = recorder
      recordingStreamRef.current = audioStream
      chunksRef.current = []
      let recorderFailed = false
      recorder.ondataavailable = event => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        if (recorderFailed) return
        const durationMs = Math.min(Date.now() - recordingStartedAt.current, 120000)
        const mimeType = recorder.mimeType || 'audio/webm'
        setRecordingDurationMs(durationMs)
        setAudioMimeType(mimeType)
        setRecording(false)
        recorderRef.current = null
        recordingStreamRef.current?.getTracks().forEach(track => track.stop())
        recordingStreamRef.current = null
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        if (blob.size < 1024 && !speechFinalTranscriptRef.current) {
          setError('No speech was captured. Try again or type your answer below.')
        }
        setOriginalTranscript(speechFinalTranscriptRef.current)
      }
      recorder.onerror = event => {
        recorderFailed = true
        stopLiveSpeechRecognition()
        const recorderError = (event as Event & { error?: DOMException }).error
        const message = recorderError?.name === 'NotAllowedError'
          ? 'The browser blocked microphone recording. Allow microphone access and try again.'
          : 'The browser could not record from this microphone. Reconnect it or use the text answer below.'
        setError(message)
        setRecording(false)
        recorderRef.current = null
        recordingStreamRef.current?.getTracks().forEach(track => track.stop())
        recordingStreamRef.current = null
        chunksRef.current = []
      }
      recorder.start(250)
      recordingStartedAt.current = Date.now()
      setRecordingSeconds(0)
      setTranscript('')
      setOriginalTranscript('')
      speechFinalTranscriptRef.current = ''
      speechRecognitionBaseRef.current = ''
      startLiveSpeechRecognition()
      setRecording(true)
    } catch (reason) {
      audioStream?.getTracks().forEach(track => track.stop())
      recorderRef.current = null
      recordingStreamRef.current = null
      const name = reason instanceof Error ? reason.name : ''
      const message = name === 'NotAllowedError' || name === 'PermissionDeniedError'
        ? 'Microphone access was blocked. Allow microphone access in your browser settings, then try again.'
        : name === 'NotFoundError' || name === 'DevicesNotFoundError'
          ? 'No microphone is available. Connect a microphone or type your answer below.'
          : name === 'NotReadableError' || name === 'TrackStartError'
            ? 'The microphone is busy or unavailable. Close other apps using it, then try again.'
            : 'The browser could not start microphone recording. Check microphone access and try again.'
      setError(`${message} You can type your answer below instead.`)
    } finally {
      setRecordingStarting(false)
    }
  }

  function stopRecording() {
    stopLiveSpeechRecognition()
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  function toggleCamera() {
    const next = !cameraOn
    streamRef.current?.getVideoTracks().forEach(track => { track.enabled = next })
    setCameraOn(next)
  }

  function toggleMicrophone() {
    const next = !microphoneOn
    streamRef.current?.getAudioTracks().forEach(track => { track.enabled = next })
    recordingStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = next })
    setMicrophoneOn(next)
    if (recording) {
      if (next) startLiveSpeechRecognition()
      else {
        stopLiveSpeechRecognition()
        setSpeechRecognitionMessage('Speech recognition paused while your microphone is muted.')
      }
    }
  }

  function replayQuestion() {
    if (!question || !window.speechSynthesis) {
      setError('Speech synthesis is not available in this browser. Read the question shown below the interviewer.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(question.question)
    utterance.rate = 0.95
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  function retakeAnswer() {
    if (recording || recordingStarting || savingAnswer) return
    setTranscript('')
    setOriginalTranscript('')
    speechFinalTranscriptRef.current = ''
    speechRecognitionBaseRef.current = ''
    setSpeechRecognitionMessage('')
    setAudioMimeType('')
    setRecordingDurationMs(0)
    setRecordingSeconds(0)
    chunksRef.current = []
    setError('')
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !question || !transcript.trim() || feedback || savingAnswer || recording || recordingStarting) return
    setSavingAnswer(true)
    setError('')
    try {
      const result = await interviewRequest<{ session: InterviewSession; feedback: Feedback }>(
        `/interviews/sessions/${session.id}/answer`,
        'POST',
        {
          questionIndex: session.currentQuestionIndex,
          originalTranscript,
          editedTranscript: transcript.trim(),
          audioMimeType: audioMimeType || undefined,
          recordingDurationMs: recordingDurationMs || undefined,
        },
      )
      setSession(result.session)
      setFeedback(result.feedback)
    } catch (reason) {
      setError(errorText(reason, 'Unable to assess your answer.'))
    } finally {
      setSavingAnswer(false)
    }
  }

  async function nextQuestion() {
    if (!session || !feedback || advancing) return
    setAdvancing(true)
    setError('')
    try {
      const result = await interviewRequest<{ session: InterviewSession }>(`/interviews/sessions/${session.id}/next`, 'POST', {})
      activeQuestionIndex.current = result.session.currentQuestionIndex
      setSession(result.session)
      if (result.session.status !== 'active') {
        router.push(`/candidate/interview-prep/results/${session.id}`)
        return
      }
      setTranscript('')
      setOriginalTranscript('')
      speechFinalTranscriptRef.current = ''
      speechRecognitionBaseRef.current = ''
      setSpeechRecognitionMessage('')
      setAudioMimeType('')
      setRecordingDurationMs(0)
      setFeedback(null)
    } catch (reason) {
      setError(errorText(reason, 'Unable to load the next question. Your assessed answer is saved.'))
    } finally {
      setAdvancing(false)
    }
  }

  async function finishInterview(reason: 'ended' | 'completed', askConfirmation = true) {
    if (!session || finishing.current && askConfirmation) return
    if (askConfirmation && !window.confirm('End this interview and save a report with all answers assessed so far? Any unsubmitted transcript will not be included.')) return
    if (recording) stopRecording()
    finishing.current = true
    setAdvancing(true)
    setError('')
    try {
      await interviewRequest<{ session: InterviewSession }>(`/interviews/sessions/${session.id}/finish`, 'POST', { reason })
      router.push(`/candidate/interview-prep/results/${session.id}`)
    } catch (failure) {
      finishing.current = false
      setError(errorText(failure, 'Unable to generate the final report. Your assessed answers are saved; retry when ready.'))
    } finally {
      setAdvancing(false)
    }
  }

  if (loading) return <div className="video-interview-state" role="status"><LoaderCircle className="interview-spinner" size={22}/> Loading interview room…</div>
  if (error && !session) return <div className="video-interview-state video-interview-error"><p role="alert">{error}</p><Link className="button primary" href="/candidate/interview-prep">Back to interview preparation</Link></div>
  if (!session || !question) return null

  return <div className="video-interview-room">
    <header className="video-interview-header">
      <div className="video-interview-title"><Link href="/candidate/interview-prep">Interview Preparation</Link><h1>AI Mock Interview</h1><p>{session.jobRole} <span>·</span> {session.interviewType} <span>·</span> {session.difficulty}</p></div>
      <div className="video-interview-header-tools">
        <div className="video-interview-countdown" aria-live="off"><Clock3 size={16}/><span>{formatTime(remainingSeconds)}</span><small>remaining</small></div>
        <InterviewProgress session={session}/>
        <button className="button secondary small video-end-button" onClick={() => void finishInterview('ended')} disabled={advancing}><PhoneOff size={15}/> End Interview</button>
      </div>
    </header>
    {error && <p className="interview-error" role="alert">{error}</p>}
    {timerReady && remainingSeconds === 0 && <p className="interview-error interview-time-expired" role="status">Your scheduled time is up. Finish the current answer, then submit it or end the interview to save your report.</p>}
    <div className="video-interview-panels">
      <section className="panel video-interview-panel interviewer-panel">
        <div className="video-interview-panel-heading"><div><span className="eyebrow">AI Interviewer</span><h2>Meet your interviewer</h2></div><span className={`interviewer-status ${speaking ? 'is-speaking' : recording ? 'is-listening' : ''}`}><i/>{speaking ? 'Speaking' : recording ? 'Listening' : 'Ready'}</span></div>
        <div className={`interviewer-stage ${speaking ? 'speaking' : ''}`}>
          <img src="/interviewer-avatar.svg" alt="Illustrated professional AI interviewer" />
          <div className="interviewer-video-label"><span className="interviewer-live-dot"/><span>AI Interviewer</span></div>
          {speaking && <div className="interviewer-speaking-indicator" aria-label="Interviewer speaking"><i/><i/><i/><i/><i/></div>}
        </div>
        <p className="interviewer-visual-note">Illustrated interviewer · questions are spoken with your browser’s speech synthesis. No generated video or lip-sync is used.</p>
        <div className="interviewer-question">
          <div><span className="eyebrow">{question.category} · Question {session.currentQuestionIndex + 1}</span><h3>{question.question}</h3></div>
          <button className="button primary" type="button" onClick={replayQuestion} disabled={speaking}><Volume2 size={16}/>{speaking ? 'Speaking…' : 'Speak / Replay Question'}</button>
        </div>
      </section>
      <section className="panel video-interview-panel candidate-panel">
        <div className="video-interview-panel-heading"><div><span className="eyebrow">Your interview space</span><h2>Candidate camera</h2></div><span className={`interviewer-status ${recording ? 'recording-status' : ''}`}><i/>{recording ? 'Recording' : cameraReady ? 'Camera ready' : 'Camera unavailable'}</span></div>
        <div className={`candidate-camera ${!cameraOn || !cameraReady ? 'camera-disabled' : ''}`}>
          <video ref={videoRef} autoPlay playsInline muted aria-label="Live candidate camera feed"/>
          {(!cameraOn || !cameraReady) && <div className="camera-placeholder"><CameraOff size={30}/><span>{cameraReady ? 'Camera off' : 'Camera preview unavailable'}</span></div>}
          {recording && <span className="recording-indicator"><i/> REC {formatTime(recordingSeconds)}</span>}
          <div className="candidate-camera-label">You · {microphoneOn ? 'Mic on' : 'Mic muted'}</div>
        </div>
        {cameraError && <p className="camera-permission-note" role="status"><AlertCircle size={15}/>{cameraError}</p>}
        <div className="camera-control-row">
          <div className="record-controls">
            {!recording
              ? <button type="button" className="button record-button" onClick={startRecording} disabled={!cameraReady || recordingStarting || Boolean(feedback) || Boolean(transcript.trim())}><span/>{recordingStarting ? 'Connecting microphone…' : 'Start Recording'}</button>
              : <button type="button" className="button stop-record-button" onClick={stopRecording}><Square size={14} fill="currentColor"/>Stop Recording</button>}
            <button type="button" className="button secondary small" onClick={retakeAnswer} disabled={recording || recordingStarting || savingAnswer || feedback !== null}><RotateCcw size={14}/>Retake Answer</button>
          </div>
          <div className="device-controls">
            <button type="button" className={`device-control ${cameraOn ? '' : 'device-muted'}`} onClick={toggleCamera} disabled={!cameraReady} aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}>{cameraOn ? <Camera size={17}/> : <CameraOff size={17}/>}</button>
            <button type="button" className={`device-control ${microphoneOn ? '' : 'device-muted'}`} onClick={toggleMicrophone} disabled={!cameraReady} aria-label={microphoneOn ? 'Mute microphone' : 'Unmute microphone'}>{microphoneOn ? <Mic size={17}/> : <MicOff size={17}/>}</button>
          </div>
        </div>
        <div className="recording-time-row"><span>{recording ? <><i className="recording-red-dot"/> Recording · speech appears below as recognized</> : recordingDurationMs ? `Recording captured · ${formatTime(Math.round(recordingDurationMs / 1000))}` : 'Recording starts only when you click Start Recording'}</span><span>{formatTime(recordingSeconds)} / 02:00</span></div>
        <p className="speech-recognition-note" role="status">{speechRecognitionMessage || 'Live speech-to-text uses your browser speech recognition, not Gemini. Browser support and network availability may vary.'}</p>
        <div className="candidate-question-reminder"><b>Question {session.currentQuestionIndex + 1}</b><p>{question.question}</p></div>
        <form className="candidate-transcript-form" onSubmit={submitAnswer}>
          <label htmlFor="interview-transcript">{recording ? 'Answer transcript (updates as you speak)' : originalTranscript ? 'Transcript (edit before submitting)' : 'Answer transcript / text fallback'}</label>
          <textarea id="interview-transcript" value={transcript} onChange={event => setTranscript(event.target.value)} maxLength={6000} disabled={Boolean(feedback) || savingAnswer} placeholder={cameraReady ? 'Your spoken words will appear here while recording. You can also type or edit your answer.' : 'Camera access is unavailable. Type your answer here to continue.'}/>
          {originalTranscript && <p className="original-transcript-note">The recognized speech is preserved in your report. Your edits will be assessed.</p>}
          <div className="candidate-answer-actions">
            <small>{transcript.length.toLocaleString()}/6,000 characters</small>
            {!feedback
              ? <button type="submit" className="button primary" disabled={savingAnswer || recording || !transcript.trim()}>{savingAnswer ? <><LoaderCircle className="interview-spinner" size={15}/> Assessing answer…</> : <>Submit Answer <ArrowRight size={15}/></>}</button>
              : <button type="button" className="button primary" onClick={() => void nextQuestion()} disabled={advancing}>{advancing ? <><LoaderCircle className="interview-spinner" size={15}/> Saving & loading…</> : session.currentQuestionIndex + 1 === session.totalQuestions ? <>View Final Report <CheckCircle2 size={15}/></> : <>Next Question <ArrowRight size={15}/></>}</button>}
          </div>
        </form>
        {feedback && <section className="video-feedback" aria-live="polite"><div className="video-feedback-score"><strong>{feedback.score}</strong><span>/100</span><p>{feedback.summary}</p></div><div className="video-dimensions">{dimensionLabels.map(([key, label]) => <div key={key}><span>{label}</span><b>{feedback.dimensions[key]}</b></div>)}</div><div className="video-feedback-columns"><div><h3>Strengths</h3><ul>{feedback.strengths.map(item => <li key={item}>{item}</li>)}</ul></div><div><h3>Improve next</h3><ul>{feedback.improvements.map(item => <li key={item}>{item}</li>)}</ul></div></div><div className="interview-sample-answer"><h4>Suggested answer outline</h4><p>{feedback.sampleAnswer}</p></div></section>}
      </section>
    </div>
  </div>
}

export function InterviewResults({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    interviewRequest<{ session: InterviewSession }>(`/interviews/sessions/${sessionId}`).then(result => {
      if (active) setSession(result.session)
    }).catch(reason => {
      if (active) setError(errorText(reason, 'Unable to load this interview report.'))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [sessionId])

  if (loading) return <div className="video-interview-state" role="status"><LoaderCircle className="interview-spinner" size={22}/> Loading your interview report…</div>
  if (error) return <div className="video-interview-state video-interview-error"><p role="alert">{error}</p><Link className="button primary" href="/candidate/interview-prep">Back to interview preparation</Link></div>
  if (!session?.report) return <div className="video-interview-state"><p>This interview does not have a final report yet.</p><Link className="button primary" href={`/candidate/interview-prep/session/${sessionId}`}>Return to interview</Link></div>

  const report = session.report
  const answered = session.questions.filter(item => item.feedback)
  return <div className="interview-report-page">
    <div className="interview-report-heading"><Link href="/candidate/interview-prep">Interview Preparation</Link><span className="eyebrow">Personalized practice report</span><h1>{session.jobRole} · {session.interviewType}</h1><p>{new Date(session.startedAt).toLocaleString()} · {answered.length} of {session.totalQuestions} questions assessed · {session.status === 'ended' ? 'Ended early' : 'Completed'}</p><Link href="/candidate/interview-prep" className="button secondary">Start another interview</Link></div>
    <section className="panel report-overview"><div className="report-overall-score"><span>Overall score</span>{report.overallScore === null ? <strong>Not scored</strong> : <strong>{report.overallScore}<small>/100</small></strong>}<small>{answered.length ? 'Average of AI-assessed answers' : 'No answers were assessed'}</small></div><div className="report-dimensions">{dimensionLabels.map(([key, label]) => <div key={key}><span>{label}</span><b>{report.dimensions[key] === null ? 'Not scored' : `${report.dimensions[key]}/100`}</b></div>)}</div></section>
    <p className="report-confidence-note"><AlertCircle size={16}/>{report.confidenceNote} {report.confidenceEstimate === null ? 'Confidence / delivery was not scored.' : `Transcript-based estimate: ${report.confidenceEstimate}/100.`}</p>
    <div className="report-content-grid">
      <ReportList title="Strengths" items={report.strengths}/>
      <ReportList title="Weaknesses" items={report.weaknesses}/>
      <ReportList title="Knowledge gaps to revisit" items={report.knowledgeGaps}/>
      <ReportList title="Suggested answer improvements" items={report.improvedAnswerOutlines}/>
      <ReportList title="Personalized practice recommendations" items={report.practiceRecommendations}/>
    </div>
    <section className="panel report-question-list"><div className="panel-heading"><h2>Question-by-question review</h2><span>{session.questions.length} questions</span></div>{session.questions.map((item, index) => <article className="report-question" key={`${index}-${item.question}`}><div className="report-question-heading"><span>Question {index + 1} · {item.category}</span><b>{item.feedback ? `${item.feedback.score}/100` : 'Not assessed'}</b></div><h3>{item.question}</h3><div className="report-transcript-columns"><div><h4>Original speech transcript</h4><p>{item.originalTranscript || 'No speech transcript was captured. A typed fallback may have been used.'}</p></div><div><h4>Answer assessed{item.originalTranscript && item.editedTranscript !== item.originalTranscript ? ' (edited)' : ''}</h4><p>{item.editedTranscript || 'No answer submitted.'}</p></div></div>{item.feedback && <><p className="report-evaluation-summary">{item.feedback.summary}</p><div className="report-answer-improvement"><b>Suggested improved answer outline</b><p>{item.feedback.sampleAnswer}</p></div><div className="report-question-scores">{dimensionLabels.map(([key, label]) => <span key={key}>{label}: <b>{item.feedback?.dimensions[key]}/100</b></span>)}</div></>}</article>)}</section>
    <Link href="/candidate/dashboard" className="button primary"><ArrowRight size={15}/> Return to candidate dashboard</Link>
  </div>
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return <section className="panel report-list-card"><h2>{title}</h2>{items.length ? <ul>{items.map(item => <li key={item}>{item}</li>)}</ul> : <p>Not enough assessed answers to provide this insight.</p>}</section>
}
