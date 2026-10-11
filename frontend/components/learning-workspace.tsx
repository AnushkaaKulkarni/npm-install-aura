'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Award, BarChart3, BookOpen, Check, CheckCircle2,
  Clock3, ExternalLink, FileText, Filter, GraduationCap, Layers, Play, RefreshCw,
  RotateCcw, Search, Sparkles, Tag, Video, Volume2, X
} from 'lucide-react'
import {
  apiRequest, type LearningResource, type LearnerProgressSummary,
  type Lesson, type UserProgress, type ExternalLearningResult
} from '@/lib/api'

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

function getYouTubeVideoId(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    let id = ''
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || ''
    else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || ''
    }
    return /^[\w-]{11}$/.test(id) ? id : null
  } catch { return null }
}

export function LearningWorkspace({
  onSelectResource,
  initialResourceId,
}: {
  onSelectResource?: (res: LearningResource) => void
  initialResourceId?: string | null
}) {
  const [activeResource, setActiveResource] = useState<LearningResource | null>(null)
  const [resources, setResources] = useState<LearningResource[]>([])
  const [recommendations, setRecommendations] = useState<LearningResource[]>([])
  const [progressSummary, setProgressSummary] = useState<LearnerProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'recommended' | 'in_progress' | 'all' | 'completed'>('recommended')
  const [sourceTab, setSourceTab] = useState<'providers' | 'online'>('providers')
  const [externalQuery, setExternalQuery] = useState('')
  const [externalSource, setExternalSource] = useState('all')
  const [externalResults, setExternalResults] = useState<ExternalLearningResult[]>([])
  const [externalLoading, setExternalLoading] = useState(false)
  const [externalError, setExternalError] = useState('')

  // Load published catalogue, candidate progress, and recommendations
  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.allSettled([
      apiRequest<{ resources: LearningResource[] }>('/resources'),
      apiRequest<{ recommendations: LearningResource[] }>('/resources/recommendations?targetRole=Software Developer (Fresher)'),
      apiRequest<LearnerProgressSummary>('/progress/my'),
    ]).then(([resResult, recResult, progResult]) => {
      if (!active) return

      if (resResult.status === 'fulfilled') {
        setResources(resResult.value.resources || [])
        // If an initial resource id was requested, open it
        if (initialResourceId) {
          const found = resResult.value.resources.find((r) => r.id === initialResourceId)
          if (found) setActiveResource(found)
        }
      }

      if (recResult.status === 'fulfilled') {
        setRecommendations(recResult.value.recommendations || [])
      }

      if (progResult.status === 'fulfilled') {
        setProgressSummary(progResult.value)
      }

      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [initialResourceId])

  function openResource(id: string) {
    const found = resources.find((r) => r.id === id)
    if (found) {
      setActiveResource(found)
      return
    }
    apiRequest<{ resource: LearningResource }>(`/resources/${id}`)
      .then((res) => setActiveResource(res.resource))
      .catch(() => {})
  }

  // Refresh progress when user returns from player
  function refreshProgress() {
    apiRequest<LearnerProgressSummary>('/progress/my')
      .then((data) => setProgressSummary(data))
      .catch(() => {})

    apiRequest<{ resources: LearningResource[] }>('/resources')
      .then((data) => setResources(data.resources || []))
      .catch(() => {})
  }

  async function searchExternal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = externalQuery.trim()
    if (!query || query.length > 200) {
      setExternalError(query ? 'Keep the search under 200 characters.' : 'Enter a topic to search.')
      setExternalResults([])
      return
    }
    setExternalLoading(true)
    setExternalError('')
    try {
      const params = new URLSearchParams({ q: query, source: externalSource })
      const data = await apiRequest<{ results: ExternalLearningResult[] }>(`/search/external?${params}`)
      setExternalResults(data.results || [])
    } catch (err) {
      setExternalResults([])
      setExternalError(err instanceof Error ? err.message : 'External search failed. Try again.')
    } finally {
      setExternalLoading(false)
    }
  }

  // Filter catalogue
  const filteredResources = resources.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
    if (difficultyFilter !== 'all' && r.difficulty !== difficultyFilter) return false
    if (typeFilter !== 'all' && r.resourceType !== typeFilter) return false
    if (languageFilter !== 'all' && !r.language.toLowerCase().includes(languageFilter.toLowerCase())) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = r.title.toLowerCase().includes(q)
      const matchSkill = r.skills.some((s) => s.toLowerCase().includes(q))
      const matchRole = r.targetRoles.some((ro) => ro.toLowerCase().includes(q))
      if (!matchTitle && !matchSkill && !matchRole) return false
    }
    return true
  })

  const inProgressList = progressSummary?.inProgress || []
  const completedList = progressSummary?.completed || []

  // If candidate is actively in the player view
  if (activeResource) {
    return (
      <LearnerPlayerView
        resource={activeResource}
        onBack={() => {
          setActiveResource(null)
          refreshProgress()
        }}
        onProgressSaved={() => refreshProgress()}
      />
    )
  }

  const metricStats = progressSummary?.stats || {
    startedCount: inProgressList.length,
    completedCount: completedList.length,
    totalMinutesLearned: inProgressList.reduce((acc, i) => acc + Math.round((i.playbackPositionSeconds || 0) / 60), 0),
    skillsDevelopedCount: 3,
  }

  return (
    <div className="learning-hub-container">
      {/* Hero Banner */}
      <div className="learning-hero-banner">
        <div>
          <span className="eyebrow" style={{ color: '#fed7aa' }}>
            <Sparkles size={14} /> Skills-to-Opportunity Pathway
          </span>
          <h2>Candidate Learning Hub</h2>
          <p>
            Build the exact capabilities required for your target jobs. Every resource is mapped directly to
            employer requirements and verified Indian skill taxonomies.
          </p>
        </div>
        <div style={{ display: 'none' }} />
      </div>

      <div className="learning-source-tabs" role="tablist" aria-label="Learning source">
        <button type="button" role="tab" aria-selected={sourceTab === 'providers'} onClick={() => setSourceTab('providers')}>From Training Providers</button>
        <button type="button" role="tab" aria-selected={sourceTab === 'online'} onClick={() => setSourceTab('online')}>Discover Courses Online</button>
      </div>

      {sourceTab === 'online' ? (
        <section className="panel external-learning-panel">
          <h2>Discover Courses Online</h2>
          <p>Find learning material on external sites. These results are separate from provider-published RozgarLink resources.</p>
          <form className="external-search-form" onSubmit={searchExternal}>
            <input value={externalQuery} onChange={(event) => setExternalQuery(event.target.value)} placeholder="Try React tutorials or SQL interview preparation" aria-label="Search external learning resources" maxLength={200} />
            <select value={externalSource} onChange={(event) => setExternalSource(event.target.value)} aria-label="Search source">
              <option value="all">All results</option><option value="youtube">YouTube videos</option><option value="courses">Courses and tutorials</option>
            </select>
            <button className="button primary" type="submit" disabled={externalLoading}>{externalLoading ? 'Searching…' : 'Search'}</button>
          </form>
          {externalError && <p role="alert" className="external-search-error">{externalError}</p>}
          {externalLoading && <p role="status">Searching external sources…</p>}
          {!externalLoading && !externalError && externalResults.length === 0 && <p>Search a topic to see real external results.</p>}
          <div className="external-result-grid">
            {externalResults.map((result) => (
              <article className="panel external-result-card" key={result.id || result.url}>
                {result.thumbnail && <img src={result.thumbnail} alt="" loading="lazy" />}
                <span className="eyebrow">{result.source} · {result.resultType}</span>
                <h3>{result.title}</h3>
                <p>{result.description || 'No description provided by the source.'}</p>
                <a className="button secondary small" href={result.url} target="_blank" rel="noopener noreferrer">{result.resultType === 'Video tutorial' ? 'Watch Video' : 'Open Course'} <ExternalLink size={13}/></a>
              </article>
            ))}
          </div>
        </section>
      ) : <>

      {/* Metric Ribbon */}
      <div className="learner-metric-ribbon">
        <div className="learner-metric-card">
          <div className="metric-icon"><Play size={18} /></div>
          <div>
            <strong>{inProgressList.length}</strong>
            <span>In-Progress Materials</span>
          </div>
        </div>
        <div className="learner-metric-card">
          <div className="metric-icon"><CheckCircle2 size={18} /></div>
          <div>
            <strong>{completedList.length}</strong>
            <span>Completed Resources</span>
          </div>
        </div>
        <div className="learner-metric-card">
          <div className="metric-icon"><Clock3 size={18} /></div>
          <div>
            <strong>{metricStats.totalMinutesLearned} mins</strong>
            <span>Tracked Learning Time</span>
          </div>
        </div>
        <div className="learner-metric-card">
          <div className="metric-icon"><Award size={18} /></div>
          <div>
            <strong>{progressSummary?.stats?.skillsDeveloped?.length || 4}</strong>
            <span>Skills Being Developed</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Navigation */}
      <div className="panel" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '12px', overflowX: 'auto' }}>
          <button
            type="button"
            className={activeTab === 'recommended' ? 'button primary small' : 'button secondary small'}
            onClick={() => setActiveTab('recommended')}
          >
            <Sparkles size={13} /> Recommended for You ({recommendations.length})
          </button>
          <button
            type="button"
            className={activeTab === 'in_progress' ? 'button primary small' : 'button secondary small'}
            onClick={() => setActiveTab('in_progress')}
          >
            <Play size={13} /> Continue Learning ({inProgressList.length})
          </button>
          <button
            type="button"
            className={activeTab === 'all' ? 'button primary small' : 'button secondary small'}
            onClick={() => setActiveTab('all')}
          >
            <BookOpen size={13} /> All Courses & Resources ({resources.length})
          </button>
          <button
            type="button"
            className={activeTab === 'completed' ? 'button primary small' : 'button secondary small'}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle2 size={13} /> Completed ({completedList.length})
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="learning-filter-bar" style={{ marginTop: '12px', border: 0, padding: 0 }}>
          <div className="search-input">
            <Search size={14} color="var(--muted)" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, course title, or skill..."
            />
          </div>

          <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Formats</option>
            <option value="video">Videos</option>
            <option value="course">Multi-lesson Courses</option>
            <option value="document">Documents</option>
            <option value="exercise">Exercises</option>
          </select>

          <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
            <option value="all">All Languages</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi / Bilingual</option>
          </select>
        </div>
      </div>

      {/* TAB CONTENT: CONTINUE LEARNING (IN-PROGRESS) */}
      {activeTab === 'in_progress' && (
        <section>
          <div className="panel-heading" style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', color: 'var(--navy)' }}>Continue Where You Left Off</h2>
            <span className="helper">Playback positions are automatically saved to your profile.</span>
          </div>
          {inProgressList.length > 0 ? (
            <div className="resource-cards-grid">
              {inProgressList.map((item) => (
                <ResourceCard
                  key={item.id || item.progressId || item.resourceId}
                  resource={item}
                  onOpen={() => openResource(item.resourceId || item.id || item.progressId)}
                />
              ))}
            </div>
          ) : (
            <div className="panel employer-empty-state">
              <Play size={28} />
              <h3>No in-progress courses</h3>
              <p>Pick a recommended resource below to start learning and tracking your progress.</p>
              <button type="button" className="button primary small" onClick={() => setActiveTab('recommended')}>
                View Recommendations
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT: RECOMMENDED FOR YOU */}
      {activeTab === 'recommended' && (
        <section>
          <div className="panel-heading" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '16px', color: 'var(--navy)' }}>Skill-Gap Linked Recommendations</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '11px' }}>
                Curriculum recommended based on your target role: <b>Software Developer (Fresher)</b> and missing skills.
              </p>
            </div>
          </div>
          {recommendations.length > 0 ? (
            <div className="resource-cards-grid">
              {recommendations.map((item) => (
                <ResourceCard
                  key={item.id}
                  resource={item}
                  onOpen={() => setActiveResource(item)}
                />
              ))}
            </div>
          ) : (
            <div className="panel employer-empty-state">
              <Sparkles size={28} />
              <h3>No recommendations found</h3>
              <p>All published materials are accessible under All Courses & Resources.</p>
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT: ALL RESOURCES */}
      {activeTab === 'all' && (
        <section>
          <div className="panel-heading" style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', color: 'var(--navy)' }}>Published Learning Catalogue</h2>
            <span className="helper">{filteredResources.length} materials available</span>
          </div>
          {filteredResources.length > 0 ? (
            <div className="resource-cards-grid">
              {filteredResources.map((item) => (
                <ResourceCard
                  key={item.id}
                  resource={item}
                  onOpen={() => setActiveResource(item)}
                />
              ))}
            </div>
          ) : (
            <div className="panel employer-empty-state">
              <BookOpen size={28} />
              <h3>No matching materials</h3>
              <p>Try clearing your search query or filters.</p>
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT: COMPLETED */}
      {activeTab === 'completed' && (
        <section>
          <div className="panel-heading" style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', color: 'var(--navy)' }}>Completed Learning Materials</h2>
            <span className="helper">Replay or review completed curriculum anytime.</span>
          </div>
          {completedList.length > 0 ? (
            <div className="resource-cards-grid">
              {completedList.map((item) => (
                <ResourceCard
                  key={item.id || item.progressId || item.resourceId}
                  resource={item}
                  onOpen={() => openResource(item.resourceId || item.id || item.progressId)}
                />
              ))}
            </div>
          ) : (
            <div className="panel employer-empty-state">
              <Award size={28} />
              <h3>No completed materials yet</h3>
              <p>Complete at least 90% of a video or course to record completion.</p>
            </div>
          )}
        </section>
      )}
      </>}
    </div>
  )
}

function getDerivedThumbnail(resource: any): string | null {
  if (resource?.thumbnailUrl && typeof resource.thumbnailUrl === 'string' && resource.thumbnailUrl.trim()) {
    return resource.thumbnailUrl.trim()
  }
  if (resource?.contentUrl && typeof resource.contentUrl === 'string') {
    const ytMatch = resource.contentUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
    }
  }
  return null
}

/* -------------------------------------------------------------
   RESOURCE CARD COMPONENT (WITH YOUTUBE-STYLE WATCHED BAR)
------------------------------------------------------------- */
function ResourceCard({
  resource,
  onOpen,
}: {
  resource: any
  onOpen: () => void
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const thumbUrl = getDerivedThumbnail(resource)
  const isDocument = resource.resourceType === 'document'

  const percent = resource.completionPercentage !== undefined
    ? (resource.completionPercentage || 0)
    : (resource.userProgress?.completionPercentage || 0)
  const isCompleted = resource.status === 'completed' || resource.userProgress?.status === 'completed' || percent >= 90
  const isStarted = percent > 0
  const playbackTracked = resource.resourceType === 'video' || resource.resourceType === 'course'

  return (
    <article className="resource-card-v2">
      {/* Thumbnail with Thin YouTube-style Progress Bar */}
      <div className="resource-card-thumb">
        {thumbUrl && !imgFailed ? (
          <img
            src={thumbUrl}
            alt={resource.title}
            onError={() => setImgFailed(true)}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : isDocument ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: '#fff', gap: '6px' }}>
            <FileText size={32} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>PDF Document</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#fff', gap: '6px' }}>
            <Play size={28} style={{ opacity: 0.9, color: '#f59e0b' }} />
            <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 500 }}>
              {resource.resourceType === 'course' ? 'Interactive Course' : 'Learning Video'}
            </span>
          </div>
        )}

        <div className="thumb-overlay-badge">
          {resource.resourceType === 'course' ? <Layers size={11} /> : isDocument ? <FileText size={11} /> : <Video size={11} />}
          {resource.resourceType}
        </div>

        {resource.durationMinutes > 0 && <div className="thumb-duration">{resource.durationMinutes}m</div>}

        {/* THIN YOUTUBE-STYLE WATCHED PROGRESS BAR */}
        {playbackTracked && isStarted && (
          <div className="resource-card-thumb-progress">
            <div
              className="fill"
              style={{
                width: `${percent}%`,
                background: isCompleted ? '#237a57' : '#e6a23c',
              }}
            />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="resource-card-body">
        <div className="resource-provider-line">
          <span>{resource.provider?.name || 'EduSkills Academy'}</span>
          <span className="badge match" style={{ fontSize: '8px', padding: '2px 5px' }}>
            {resource.difficulty}
          </span>
        </div>

        <h3 className="resource-title">{resource.title}</h3>
        <p className="resource-desc">{resource.description}</p>

        {/* Recommendation reason if available */}
        {resource.recommendationReason && (
          <div className="resource-reason-badge">
            <Sparkles size={12} color="#b45309" />
            <span style={{ fontSize: '10px' }}>{resource.recommendationReason}</span>
          </div>
        )}

        {/* Skills Chips */}
        <div className="resource-meta-chips">
          {(resource.skills || []).slice(0, 3).map((s: string, idx: number) => (
            <span key={`${s}-${idx}`} className="resource-meta-chip">{s}</span>
          ))}
          {(resource.skills || []).length > 3 && (
            <span className="resource-meta-chip">+{(resource.skills || []).length - 3}</span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="resource-card-footer">
        {!playbackTracked ? (
          <div className="resume-progress-info">{isCompleted ? 'Learner-reported complete' : resource.userProgress ? 'Opened' : 'Not started'}</div>
        ) : isStarted ? (
          <div className="resume-progress-info">
            {isCompleted ? (
              <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Completed
              </span>
            ) : (
              <span style={{ color: '#b45309' }}>{percent}% watched</span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
            {resource.language}
          </span>
        )}

        <button type="button" className="button primary small" onClick={onOpen}>
          {isStarted ? (isCompleted ? 'Replay' : 'Resume Learning') : 'Start Learning'}
          <ArrowRight size={13} />
        </button>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------
   LEARNER PLAYER VIEW (VIDEO, RESUME, TRACKING, COMPLETION)
------------------------------------------------------------- */
function LearnerPlayerView({
  resource,
  onBack,
  onProgressSaved,
}: {
  resource: LearningResource
  onBack: () => void
  onProgressSaved?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const youtubeMountRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<any>(null)
  const lastSavedPositionRef = useRef<number>(0)
  const lastSaveTimeRef = useRef<number>(0)
  const completionSaveInFlightRef = useRef(false)

  const [currentPosition, setCurrentPosition] = useState(resource.userProgress?.playbackPositionSeconds || 0)
  const [duration, setDuration] = useState(resource.durationSeconds || (resource.durationMinutes ? resource.durationMinutes * 60 : 0))
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCompleted, setIsCompleted] = useState(resource.userProgress?.status === 'completed')
  const [progressSaveError, setProgressSaveError] = useState('')
  const [resumeNotice, setResumeNotice] = useState<string | null>(null)
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)

  // Current lesson for courses
  const lessons = resource.lessons || []
  const activeLesson = lessons[activeLessonIndex] || null

  // Playback content URL
  const activeContentUrl = activeLesson?.contentUrl || resource.contentUrl
  const youtubeVideoId = getYouTubeVideoId(activeContentUrl)

  // Format seconds to mm:ss
  function formatTime(secs: number) {
    const mins = Math.floor(secs / 60)
    const rem = Math.floor(secs % 60)
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`
  }

  // Restore playback position on mount
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const initialSecs = resource.userProgress?.playbackPositionSeconds || 0
    if (initialSecs > 0) {
      video.currentTime = initialSecs
      setCurrentPosition(initialSecs)
      setResumeNotice(`Playback resumed from ${formatTime(initialSecs)}${resource.durationSeconds ? ` (${Math.round((initialSecs / resource.durationSeconds) * 100)}% watched)` : ''}`)
    }
  }, [resource])

  useEffect(() => {
    if (!youtubeVideoId || !youtubeMountRef.current) return
    let disposed = false
    let poll: ReturnType<typeof setInterval> | null = null
    const persistYouTube = async (position: number, total: number, complete = false) => {
      if (!(total > 0)) return
      setDuration(Math.floor(total))
      setCurrentPosition(Math.floor(position))
      try {
        const result = await apiRequest<{ progress: UserProgress }>(`/progress/${resource.id}`, {
          method: 'POST',
          body: JSON.stringify({ playbackPositionSeconds: position, totalDurationSeconds: total, lessonId: activeLesson?.id || 'main', markComplete: complete }),
        })
        setProgressSaveError('')
        if (result.progress.status === 'completed') setIsCompleted(true)
        onProgressSaved?.()
      } catch {
        setProgressSaveError('Progress could not be saved. Check your connection and resume playback to retry.')
      }
    }
    const initialize = () => {
      if (disposed || !window.YT?.Player || !youtubeMountRef.current) return
      youtubePlayerRef.current = new window.YT.Player(youtubeMountRef.current, {
        videoId: youtubeVideoId,
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onReady: (event: any) => {
            const total = event.target.getDuration()
            if (total > 0) {
              setDuration(Math.floor(total))
              const resumeAt = resource.userProgress?.playbackPositionSeconds || 0
              if (resumeAt > 0 && resumeAt < total) event.target.seekTo(resumeAt, true)
            }
          },
          onStateChange: (event: any) => {
            const player = event.target
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              if (!poll) poll = setInterval(() => {
                const total = player.getDuration()
                const position = player.getCurrentTime()
                setCurrentPosition(Math.floor(position))
                if (total > 0 && Date.now() - lastSaveTimeRef.current >= 5000 && Math.abs(position - lastSavedPositionRef.current) >= 3) {
                  lastSaveTimeRef.current = Date.now()
                  lastSavedPositionRef.current = position
                  void persistYouTube(position, total, position / total >= 0.9)
                }
              }, 1000)
            } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              if (poll) { clearInterval(poll); poll = null }
              void persistYouTube(player.getCurrentTime(), player.getDuration(), event.data === window.YT.PlayerState.ENDED)
            }
          },
          onError: () => setProgressSaveError('This YouTube video is unavailable or cannot be embedded. Open it on YouTube instead.'),
        },
      })
    }
    if (window.YT?.Player) initialize()
    else {
      const existing = document.getElementById('youtube-iframe-api') as HTMLScriptElement | null
      const script = existing || Object.assign(document.createElement('script'), { id: 'youtube-iframe-api', src: 'https://www.youtube.com/iframe_api' })
      window.onYouTubeIframeAPIReady = initialize
      if (!existing) document.head.appendChild(script)
    }
    return () => {
      disposed = true
      if (poll) clearInterval(poll)
      youtubePlayerRef.current?.destroy?.()
      youtubePlayerRef.current = null
    }
  }, [youtubeVideoId, resource.id, activeLesson?.id])

  // Save progress to backend (throttled)
  async function persistProgress(positionSecs: number, forceComplete = false) {
    const totalSecs = duration > 0 ? duration : (resource.durationSeconds || 0)
    if (totalSecs <= 0) {
      setProgressSaveError('Playback duration is not available yet; progress has not been saved.')
      return false
    }
    setProgressSaveError('')
    try {
      const res = await apiRequest<{ progress: UserProgress }>(`/progress/${resource.id}`, {
        method: 'POST',
        body: JSON.stringify({
          playbackPositionSeconds: positionSecs,
          totalDurationSeconds: totalSecs,
          markComplete: forceComplete,
          lessonId: activeLesson ? activeLesson.id : 'main',
        }),
      })

      lastSavedPositionRef.current = positionSecs
      lastSaveTimeRef.current = Date.now()

      if (res.progress.status === 'completed') {
        setIsCompleted(true)
      }
      if (onProgressSaved) onProgressSaved()
      return true
    } catch {
      setProgressSaveError('Progress could not be saved. Check your connection and resume playback to retry.')
      return false
    }
  }

  async function recordExternalActivity(markComplete = false) {
    setProgressSaveError('')
    try {
      await apiRequest(`/progress/${resource.id}`, {
        method: 'POST',
        body: JSON.stringify({ playbackPositionSeconds: 0, totalDurationSeconds: 0, markComplete }),
      })
      if (markComplete) setIsCompleted(true)
      if (onProgressSaved) onProgressSaved()
    } catch {
      setProgressSaveError('This learning activity could not be saved. Please try again.')
    }
  }

  // Handle video time update
  function handleTimeUpdate() {
    const video = videoRef.current
    if (!video) return

    const currentSecs = Math.floor(video.currentTime)
    setCurrentPosition(currentSecs)
    if (Number.isFinite(video.duration) && video.duration > 0 && duration !== Math.floor(video.duration)) setDuration(Math.floor(video.duration))

    // Check completion threshold (>= 90%)
    const percent = (currentSecs / (video.duration || duration)) * 100
    if (percent >= 90 && !isCompleted && !completionSaveInFlightRef.current) {
      completionSaveInFlightRef.current = true
      void persistProgress(currentSecs, true).finally(() => { completionSaveInFlightRef.current = false })
      return
    }

    // Throttle progress persistence to once every 5 seconds
    const now = Date.now()
    if (now - lastSaveTimeRef.current >= 5000 && Math.abs(currentSecs - lastSavedPositionRef.current) >= 3) {
      persistProgress(currentSecs, false)
    }
  }

  // Handle pause and end
  function handlePause() {
    setIsPlaying(false)
    if (videoRef.current && duration > 0) {
      persistProgress(Math.floor(videoRef.current.currentTime), false)
    }
  }

  function handleEnded() {
    setIsPlaying(false)
    if (videoRef.current) {
      const actualDuration = videoRef.current.duration
      if (Number.isFinite(actualDuration) && actualDuration > 0) {
        void persistProgress(Math.floor(actualDuration), true)
      }
    }
  }

  // Replay from beginning (00:00) without resetting completed status
  function handleReplay() {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
      setCurrentPosition(0)
      setIsPlaying(true)
      persistProgress(0, false)
    }
  }

  // Manual mark complete
  function handleMarkComplete() {
    void recordExternalActivity(true)
  }

  const completionPercent = duration > 0 ? Math.min(100, Math.round((currentPosition / duration) * 100)) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <button type="button" onClick={onBack} className="button secondary">
          <ArrowLeft size={15} /> Back to Learning Hub
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCompleted && (
            <span className="badge success" style={{ padding: '6px 10px', fontSize: '11px' }}>
              <CheckCircle2 size={13} /> {resource.resourceType === 'external' ? 'Learner-reported complete' : 'Completed'}
            </span>
          )}
          {resource.resourceType === 'external' && <button type="button" onClick={handleMarkComplete} className="button secondary small">
            <Check size={13} /> {isCompleted ? 'Learner-Reported Complete' : 'Mark Complete'}
          </button>}
        </div>
      </div>

      {/* Resume Notice Alert */}
      {resumeNotice && (
        <div className="player-resume-alert">
          <span>{resumeNotice}</span>
          <button
            type="button"
            onClick={() => setResumeNotice(null)}
            style={{ border: 0, background: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Player Grid */}
      <div className="player-container">
        {/* Left: Video / Content Player */}
        <div>
          {resource.resourceType === 'video' || resource.resourceType === 'course' ? (
            <div className="video-player-surface">
              {youtubeVideoId ? <div ref={youtubeMountRef} id={`youtube-${resource.id}`} aria-label={`YouTube player for ${resource.title}`} /> : <video
                ref={videoRef}
                src={activeContentUrl}
                controls
                playsInline
                poster={resource.thumbnailUrl}
                onLoadedMetadata={(e) => {
                  const target = e.currentTarget
                  if (target.duration && Number.isFinite(target.duration)) {
                    setDuration(Math.floor(target.duration))
                  }
                }}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={handlePause}
                onEnded={handleEnded}
              />}
            </div>
          ) : (
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '36px 24px',
                textAlign: 'center',
              }}
            >
              <FileText size={48} color="var(--blue)" style={{ margin: '0 auto 14px' }} />
              <h2>{resource.title}</h2>
              <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto 16px', fontSize: '13px' }}>
                {resource.description}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a
                  href={resource.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button primary"
                  onClick={() => { void recordExternalActivity(false) }}
                >
                  <ExternalLink size={15} /> {resource.resourceType === 'external' ? 'Open Course' : 'Open Material in New Tab'}
                </a>
                {resource.resourceType === 'external' && <button type="button" className="button secondary" onClick={handleMarkComplete}><Check size={14} /> Mark learner-reported complete</button>}
              </div>
              {resource.resourceType === 'external' && <p role="status">Status: {isCompleted ? 'Learner-reported complete' : resource.userProgress ? 'Opened' : 'Not started'}. External playback is not tracked.</p>}
            </div>
          )}

          {progressSaveError && <p role="alert" className="external-search-error">{progressSaveError}</p>}
          {youtubeVideoId && <p><a href={activeContentUrl} target="_blank" rel="noopener noreferrer" onClick={() => { void recordExternalActivity(false) }}>Open on YouTube <ExternalLink size={13}/></a></p>}

          {/* Thin watched progress bar is shown only when actual media duration is known. */}
          {(resource.resourceType === 'video' || resource.resourceType === 'course') && duration > 0 && <>
          <div style={{ marginTop: '10px' }}>
            <div className="thin-progress-bar">
              <div
                className={`thin-progress-fill ${isCompleted ? 'completed' : ''}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: 'var(--muted)' }}>
              <span>
                Playback Position: <b>{formatTime(currentPosition)}</b> / {formatTime(duration)} ({completionPercent}%)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleReplay}
                  style={{ border: 0, background: 'none', color: 'var(--blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}
                >
                  <RotateCcw size={12} /> Replay from Start
                </button>
              </div>
            </div>
          </div>
          </>}

          {/* Resource Title & Details */}
          <div className="panel" style={{ marginTop: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
              <div>
                <span className="eyebrow">{resource.category}</span>
                <h1 style={{ fontSize: '20px', color: 'var(--navy)', margin: '6px 0 8px' }}>
                  {activeLesson ? `${activeLesson.title} — ${resource.title}` : resource.title}
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
                  Published by <b>{resource.provider?.name || 'EduSkills Academy'}</b> · {resource.language} · {resource.difficulty}
                </p>
              </div>
            </div>

            <div style={{ margin: '16px 0', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--navy)', margin: '0 0 6px' }}>About this resource</h3>
              <p style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                {resource.description}
              </p>
            </div>

            {/* Skills & Recommendation context */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--navy)', margin: '0 0 8px' }}>Skills you are developing</h3>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {resource.skills.map((s) => (
                  <span key={s} className="tag" style={{ fontSize: '11px' }}>{s}</span>
                ))}
              </div>
            </div>

            {resource.targetRoles?.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <small style={{ color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Applicable for Career Roles:
                </small>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {resource.targetRoles.map((r) => (
                    <span key={r} className="skill-tag-chip" style={{ fontSize: '10px' }}>{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Multi-lesson Course List or Curriculum Context */}
        <aside>
          {lessons.length > 0 ? (
            <div className="panel lesson-list-panel">
              <div className="panel-heading">
                <h2 style={{ fontSize: '14px', margin: 0 }}>Course Lessons ({lessons.length})</h2>
                <span className="helper">{isCompleted ? '100% Completed' : `${completionPercent}% Done`}</span>
              </div>
              <div style={{ display: 'grid', gap: '6px', marginTop: '10px' }}>
                {lessons.map((lesson, idx) => {
                  const isActive = idx === activeLessonIndex
                  return (
                    <div
                      key={lesson.id || idx}
                      className={`lesson-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveLessonIndex(idx)
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0
                          videoRef.current.play()
                        }
                      }}
                    >
                      <Play size={14} color={isActive ? 'var(--blue)' : 'var(--muted)'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lesson.title}
                        </div>
                        <small style={{ color: 'var(--muted)', fontSize: '10px' }}>
                          {lesson.durationMinutes} mins
                        </small>
                      </div>
                      {isCompleted && <CheckCircle2 size={13} color="var(--green)" />}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="panel" style={{ padding: '18px' }}>
              <div className="panel-heading">
                <h2 style={{ fontSize: '14px', margin: 0 }}>Career Linkage</h2>
                <Sparkles size={16} color="var(--blue)" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 10px' }}>
                  Completing this module provides verifiable evidence towards your <b>Competency Profile</b> and
                  addresses skill gaps identified for <b>Software Developer (Fresher)</b> positions.
                </p>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                  <b style={{ color: 'var(--navy)' }}>Automated Tracking Active:</b>
                  <p style={{ margin: '4px 0 0', fontSize: '11px' }}>
                    Your playback timestamp is synchronized with RozgarLink government skilling records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
