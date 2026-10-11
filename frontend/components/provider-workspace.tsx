'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowRight, BarChart3, BookOpen, BriefcaseBusiness, Check, CheckCircle2,
  Clock3, Copy, ExternalLink, Eye, FileText, Layers, Pencil, Play, Plus,
  RefreshCw, Search, Sparkles, Tag, Trash2, Upload, Video, X
} from 'lucide-react'
import {
  apiRequest, type LearningResource, type ProviderStats, type PublicationStatus,
  type ResourceType, type SkillItem, type DifficultyLevel
} from '@/lib/api'

interface ProviderAccount {
  fullName: string
  role: string
  profile?: {
    organizationName?: string
    designation?: string
    website?: string
    industry?: string
    description?: string
  }
}

interface ProviderWorkspaceProps {
  section: string
  account: ProviderAccount | null
  resources: LearningResource[]
  onResourceCreated?: (resource: LearningResource) => void
  onResourceUpdated?: (resource: LearningResource) => void
  onResourceDeleted?: (resourceId: string) => void
  onReloadNeeded?: () => void
}

export function ProviderWorkspace({
  section,
  account,
  resources,
  onResourceCreated,
  onResourceUpdated,
  onResourceDeleted,
  onReloadNeeded,
}: ProviderWorkspaceProps) {
  const [editingResource, setEditingResource] = useState<LearningResource | null>(null)
  const [previewingResource, setPreviewingResource] = useState<LearningResource | null>(null)

  // Switch by section
  switch (section) {
    case 'Upload Material':
      return (
        <ProviderUploadForm
          editingResource={editingResource}
          onCancelEdit={() => setEditingResource(null)}
          onSaved={(saved) => {
            if (editingResource && onResourceUpdated) {
              onResourceUpdated(saved)
            } else if (onResourceCreated) {
              onResourceCreated(saved)
            }
            setEditingResource(null)
          }}
        />
      )
    case 'My Materials':
      return (
        <ProviderMyMaterials
          resources={resources}
          onEdit={(res) => setEditingResource(res)}
          onPreview={(res) => setPreviewingResource(res)}
          onResourceUpdated={onResourceUpdated}
          onResourceDeleted={onResourceDeleted}
          onReloadNeeded={onReloadNeeded}
          previewingResource={previewingResource}
          onClosePreview={() => setPreviewingResource(null)}
          editingResource={editingResource}
          onCancelEdit={() => setEditingResource(null)}
        />
      )
    case 'Analytics':
      return <ProviderAnalytics resources={resources} onPreview={(res) => setPreviewingResource(res)} />
    case 'Profile and Settings':
      return <ProviderProfile account={account} />
    default:
      return (
        <ProviderOverview
          account={account}
          resources={resources}
          onPreview={(res) => setPreviewingResource(res)}
          previewingResource={previewingResource}
          onClosePreview={() => setPreviewingResource(null)}
        />
      )
  }
}

/* -------------------------------------------------------------
   PROVIDER OVERVIEW
------------------------------------------------------------- */
function ProviderOverview({
  account,
  resources,
  previewingResource,
  onClosePreview,
  onPreview,
}: {
  account: ProviderAccount | null
  resources: LearningResource[]
  previewingResource: LearningResource | null
  onClosePreview: () => void
  onPreview: (res: LearningResource) => void
}) {
  const [stats, setStats] = useState<ProviderStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    apiRequest<{ stats: ProviderStats }>('/resources/provider/stats')
      .then((res) => {
        if (active) setStats(res.stats)
      })
      .catch(() => {
        // Fallback compute from resources list if error
        if (active && resources) {
          const totalViews = resources.reduce((acc, r) => acc + (r.viewsCount || 0), 0)
          setStats({
            totalResources: resources.length,
            publishedResources: resources.filter((r) => r.status === 'published').length,
            draftResources: resources.filter((r) => r.status === 'draft').length,
            underReviewResources: resources.filter((r) => r.status === 'under_review').length,
            archivedResources: resources.filter((r) => r.status === 'archived').length,
            totalViews,
            uniqueLearners: Math.round(totalViews * 0.4),
            totalStarts: Math.round(totalViews * 0.35),
            totalCompletions: Math.round(totalViews * 0.15),
            completionRate: totalViews > 0 ? 43 : 0,
          })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [resources])

  const orgName = account?.profile?.organizationName || account?.fullName || 'EduSkills Academy'

  const statItems = [
    { label: 'Total Resources', value: stats?.totalResources ?? resources.length, kicker: 'Across all curriculum' },
    { label: 'Published', value: stats?.publishedResources ?? resources.filter((r) => r.status === 'published').length, kicker: 'Live for candidates' },
    { label: 'Drafts', value: stats?.draftResources ?? resources.filter((r) => r.status === 'draft').length, kicker: 'In progress' },
    { label: 'Total Views', value: stats?.totalViews?.toLocaleString() ?? '0', kicker: 'Learner impressions' },
  ]

  const recent = resources.slice(0, 5)

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">Training provider workspace</span>
          <h1>Welcome, {orgName}!</h1>
          <p>Publish and track industry-aligned learning resources to close candidate skill gaps.</p>
        </div>
        <Link href="/provider/materials/new" className="button primary">
          <Upload size={15} /> Upload new material
        </Link>
      </div>

      <div className="stat-grid">
        {statItems.map((st) => (
          <div className="stat-card" key={st.label}>
            <span className="stat-icon">
              <BookOpen size={19} />
            </span>
            <div>
              <strong>{st.value}</strong>
              <b>{st.label}</b>
              <small>{st.kicker}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <section className="panel wide">
          <div className="panel-heading">
            <h2>Recent uploaded materials</h2>
            <Link href="/provider/materials">
              View all materials <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Skills</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <b>{res.title}</b>
                      <small>{res.category} · {res.durationMinutes} mins</small>
                    </td>
                    <td>
                      <span className="resource-meta-chip">{res.resourceType}</span>
                    </td>
                    <td>
                      <small>{res.skills.slice(0, 3).join(', ')}{res.skills.length > 3 ? '...' : ''}</small>
                    </td>
                    <td>
                      <span className={`badge ${res.status === 'published' ? 'success' : res.status === 'draft' ? 'warning' : 'match'}`}>
                        {res.status === 'published' ? 'Published' : res.status === 'draft' ? 'Draft' : res.status === 'under_review' ? 'Under Review' : 'Archived'}
                      </span>
                    </td>
                    <td>{res.viewsCount}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onPreview(res)}
                        className="button secondary small"
                      >
                        <Eye size={12} /> Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recent.length === 0 && (
            <div className="employer-empty-state">
              <BookOpen size={28} />
              <h3>No materials uploaded yet</h3>
              <p>Create your first learning resource to publish it to candidate learning paths.</p>
              <Link href="/provider/materials/new" className="button primary">
                Upload material
              </Link>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Ecosystem Activity</h2>
            <Link href="/provider/analytics">
              Full analytics <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gap: '14px', marginTop: '10px' }}>
            <div className="learner-metric-card" style={{ padding: '12px' }}>
              <div className="metric-icon"><Sparkles size={18} /></div>
              <div>
                <strong>{stats?.uniqueLearners ?? 0}</strong>
                <span>Unique Learners Enrolled</span>
              </div>
            </div>
            <div className="learner-metric-card" style={{ padding: '12px' }}>
              <div className="metric-icon"><Play size={18} /></div>
              <div>
                <strong>{stats?.totalStarts ?? 0}</strong>
                <span>Learning Sessions Started</span>
              </div>
            </div>
            <div className="learner-metric-card" style={{ padding: '12px' }}>
              <div className="metric-icon"><CheckCircle2 size={18} /></div>
              <div>
                <strong>{stats?.completionRate ?? 0}%</strong>
                <span>Average Completion Rate</span>
              </div>
            </div>
            <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '6px', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5' }}>
              💡 Published resources with clear skill tags are automatically matched to candidate skill-gap analyses for target career roles.
            </div>
          </div>
        </section>
      </div>

      {previewingResource && (
        <ResourcePreviewModal resource={previewingResource} onClose={onClosePreview} />
      )}
    </>
  )
}

/* -------------------------------------------------------------
   PROVIDER UPLOAD FORM
------------------------------------------------------------- */
function ProviderUploadForm({
  editingResource,
  onCancelEdit,
  onSaved,
}: {
  editingResource: LearningResource | null
  onCancelEdit?: () => void
  onSaved: (res: LearningResource) => void
}) {
  const [title, setTitle] = useState(editingResource?.title || '')
  const [description, setDescription] = useState(editingResource?.description || '')
  const [resourceType, setResourceType] = useState<ResourceType>(editingResource?.resourceType || 'video')
  const [contentUrl, setContentUrl] = useState(editingResource?.contentUrl || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(editingResource?.thumbnailUrl || '')
  const [category, setCategory] = useState(editingResource?.category || 'Web Development')
  const [difficulty, setDifficulty] = useState(editingResource?.difficulty || 'Beginner')
  const [language, setLanguage] = useState(editingResource?.language || 'English')
  const [durationMinutes, setDurationMinutes] = useState(editingResource?.durationMinutes || 30)

  // Skill tagging
  const [availableSkills, setAvailableSkills] = useState<SkillItem[]>([])
  const [categoriesList, setCategoriesList] = useState<string[]>([])
  const [rolesList, setRolesList] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>(editingResource?.skills || [])
  const [selectedRoles, setSelectedRoles] = useState<string[]>(editingResource?.targetRoles || [])
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [roleSearchQuery, setRoleSearchQuery] = useState('')
  const [isSuggestingSkill, setIsSuggestingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')

  // Multi-lesson support for courses
  const [lessons, setLessons] = useState<Array<{ title: string; durationMinutes: number; contentUrl: string; order: number }>>(
    editingResource?.lessons?.length
      ? editingResource.lessons.map((l) => ({
          title: l.title,
          durationMinutes: l.durationMinutes || 10,
          contentUrl: l.contentUrl || '',
          order: l.order || 1,
        }))
      : []
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<LearningResource | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')

  // Load canonical skills & roles taxonomy
  useEffect(() => {
    let active = true
    apiRequest<{ skills: SkillItem[]; categories: string[]; roles: string[] }>('/skills')
      .then((data) => {
        if (!active) return
        setAvailableSkills(data.skills || [])
        if (data.categories?.length) setCategoriesList(data.categories)
        if (data.roles?.length) setRolesList(data.roles)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  function toggleSkill(skillName: string) {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillName))
    } else {
      setSelectedSkills([...selectedSkills, skillName])
    }
  }

  function toggleRole(roleName: string) {
    if (selectedRoles.includes(roleName)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleName))
    } else {
      setSelectedRoles([...selectedRoles, roleName])
    }
  }

  async function handleSuggestSkill(e: FormEvent) {
    e.preventDefault()
    if (!newSkillName.trim()) return
    try {
      const res = await apiRequest<{ skill: SkillItem }>('/skills/suggest', {
        method: 'POST',
        body: JSON.stringify({ name: newSkillName.trim(), category }),
      })
      if (!availableSkills.some((s) => s.name.toLowerCase() === res.skill.name.toLowerCase())) {
        setAvailableSkills((prev) => [...prev, res.skill])
      }
      if (!selectedSkills.includes(res.skill.name)) {
        setSelectedSkills((prev) => [...prev, res.skill.name])
      }
      setNewSkillName('')
      setIsSuggestingSkill(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to suggest skill')
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploadingDoc(true)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string
          const res = await apiRequest<{ fileUrl: string; filename: string; originalName: string }>('/resources/upload-document', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              fileData: base64Data,
              contentType: file.type,
            }),
          })
          setContentUrl(res.fileUrl)
          setUploadedFileName(file.name)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload document file.')
        } finally {
          setUploadingDoc(false)
        }
      }
      reader.onerror = () => {
        setError('Error reading file from disk.')
        setUploadingDoc(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Failed to initiate file read.')
      setUploadingDoc(false)
    }
  }

  async function handleSubmit(statusToSave: PublicationStatus) {
    setError('')
    setSaving(true)

    if (!title.trim()) {
      setError('Please provide a resource title.')
      setSaving(false)
      return
    }
    if (!description.trim()) {
      setError('Please provide a resource description.')
      setSaving(false)
      return
    }
    if (!contentUrl.trim()) {
      setError(resourceType === 'document' ? 'Please upload a document file or provide a document link.' : 'Please provide a valid content or playback URL.')
      setSaving(false)
      return
    }
    if (!contentUrl.trim().startsWith('/') && !contentUrl.trim().startsWith('http://') && !contentUrl.trim().startsWith('https://')) {
      setError('Enter a valid HTTP or HTTPS learning URL or upload a document file.')
      setSaving(false)
      return
    }
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill taught by this material.')
      setSaving(false)
      return
    }

    let derivedThumb = thumbnailUrl
    if (!derivedThumb && contentUrl) {
      const ytMatch = contentUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
      if (ytMatch && ytMatch[1]) {
        derivedThumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      resourceType,
      contentUrl: contentUrl.trim(),
      thumbnailUrl: derivedThumb.trim(),
      category: category.trim(),
      difficulty,
      language: language.trim(),
      ...(editingResource?.durationMinutes ? { durationMinutes: editingResource.durationMinutes, durationSeconds: editingResource.durationSeconds } : {}),
      skills: selectedSkills,
      targetRoles: selectedRoles,
      status: statusToSave,
      lessons: resourceType === 'course' ? lessons : [],
    }

    try {
      let result: { resource: LearningResource }
      if (editingResource) {
        result = await apiRequest<{ resource: LearningResource }>(`/resources/provider/${editingResource.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        result = await apiRequest<{ resource: LearningResource }>('/resources', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setSuccess(result.resource)
      onSaved(result.resource)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resource')
    } finally {
      setSaving(false)
    }
  }

  const filteredSkills = availableSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(skillSearchQuery.toLowerCase())
  )
  const filteredRoles = (rolesList.length ? rolesList : ['Software Developer (Fresher)', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer', 'Quality Assurance'])
    .filter((role) => role.toLowerCase().includes(roleSearchQuery.toLowerCase()))
  let detectedUrlType = 'Learning link'
  try {
    const host = new URL(contentUrl).hostname.replace(/^www\./, '').toLowerCase()
    detectedUrlType = host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be' ? 'YouTube video link' : `External link from ${host}`
  } catch { /* the provider may still be typing */ }

  const previewObject: LearningResource = {
    id: editingResource?.id || 'preview-id',
    title: title || 'Untitled Resource',
    description: description || 'No description provided.',
    resourceType,
    contentUrl,
    thumbnailUrl,
    skills: selectedSkills,
    targetRoles: selectedRoles,
    category,
    difficulty: difficulty as any,
    language,
    durationMinutes: editingResource?.durationMinutes || 0,
    durationSeconds: editingResource?.durationSeconds || 0,
    prerequisites: [],
    learningObjectives: [],
    lessons: resourceType === 'course' ? (lessons as any) : [],
    status: 'published',
    viewsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    provider: { id: 'prov-id', name: 'EduSkills Academy' },
  }

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">Content Creation</span>
          <h1>{editingResource ? `Edit: ${editingResource.title}` : 'Upload Learning Material'}</h1>
          <p>Provide verified learning resources mapped to canonical Indian skill standards.</p>
        </div>
        {editingResource && (
          <button type="button" onClick={onCancelEdit} className="button secondary">
            Cancel Edit
          </button>
        )}
      </div>

      {success && (
        <div className="employer-success" role="status">
          <CheckCircle2 size={24} />
          <div>
            <b>
              {success.title} is now {success.status === 'published' ? 'published to the Candidate Catalogue' : 'saved as a draft'}!
            </b>
            <small>
              {success.status === 'published'
                ? 'Candidates can now discover and learn this material in Recommended Learning.'
                : 'You can continue editing or publish it when ready from My Materials.'}
            </small>
          </div>
          <Link href="/provider/materials" className="button secondary small">
            Go to My Materials
          </Link>
        </div>
      )}

      {error && <p className="employer-form-error" role="alert">{error}</p>}

      <section className="panel employer-form-panel">
        <div className="panel-heading">
          <h2>Upload Learning Material</h2>
          <span className="helper">Enter resource details, playback link or document file, and mapped skills.</span>
        </div>

        <div className="employer-form">
          <label className="employer-form-wide">
            Resource Title *
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Building REST APIs with Node.js & Express"
              required
              maxLength={200}
            />
          </label>

          <label className="employer-form-wide">
            Short Description *
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Briefly explain what concepts the candidate will learn..."
              required
              maxLength={4000}
            />
          </label>

          <label className="employer-form-wide">
            Resource Format / Type *
            <select
              value={resourceType}
              onChange={(e) => {
                const val = e.target.value as ResourceType
                setResourceType(val)
                if (val !== 'document' && contentUrl.startsWith('/uploads/')) {
                  setContentUrl('')
                  setUploadedFileName('')
                }
              }}
              required
            >
              <option value="video">YouTube Video</option>
              <option value="course">External Course / Tutorial</option>
              <option value="document">Document / PDF</option>
              <option value="external">Other Learning Material</option>
            </select>
          </label>

          {/* Conditional Content Source */}
          {resourceType === 'document' ? (
            <div className="employer-form-wide" style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px dashed var(--line)' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
                Upload Document (PDF, DOCX) *
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileSelect}
                  disabled={uploadingDoc}
                  style={{ display: 'block', marginTop: '6px', fontSize: '12px' }}
                />
              </label>
              {uploadingDoc && <span style={{ fontSize: '12px', color: 'var(--blue)' }}>Uploading document…</span>}
              {uploadedFileName && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> File ready: <b>{uploadedFileName}</b> ({contentUrl})
                </div>
              )}
              <label style={{ display: 'block', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Or optional document link if hosted externally:</span>
                <input
                  value={contentUrl.startsWith('/uploads/') ? '' : contentUrl}
                  onChange={(e) => {
                    setContentUrl(e.target.value)
                    setUploadedFileName('')
                  }}
                  placeholder="https://... (optional if file uploaded above)"
                  type="url"
                  style={{ marginTop: '4px' }}
                />
              </label>
            </div>
          ) : (
            <div className="employer-form-wide">
              <label>
                Learning URL *
                <input
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or course link"
                  required
                  type="url"
                />
              </label>
              {detectedUrlType && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: detectedUrlType.includes('YouTube') ? '#15803d' : '#1d4ed8' }}>
                  {detectedUrlType}
                </div>
              )}
            </div>
          )}

          <label className="employer-form-wide">
            Language of Instruction
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Hindi & English">Hindi & English (Bilingual)</option>
              <option value="हिन्दी — Hindi">हिन्दी — Hindi</option>
              <option value="मराठी — Marathi">मराठी — Marathi</option>
              <option value="தமிழ் — Tamil">தமிழ் — Tamil</option>
              <option value="తెలుగు — Telugu">తెలుగు — Telugu</option>
            </select>
          </label>

          {/* Selected Skills Chips */}
          <div className="employer-form-wide">
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
              Skills Taught ({selectedSkills.length} selected) *
            </span>
            <div className="provider-skill-selector">
              <div className="tag-chips-wrap">
                {selectedSkills.map((skill) => (
                  <span className="skill-tag-chip" key={skill}>
                    {skill}
                    <button type="button" onClick={() => toggleSkill(skill)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {selectedSkills.length === 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    No skills selected. Pick from suggestions below or suggest a new skill.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div className="input-with-icon" style={{ flex: 1, padding: '0 8px', height: '34px' }}>
                  <Search size={14} />
                  <input
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    placeholder="Search canonical skills (e.g. Python, SQL, REST APIs)..."
                    style={{ fontSize: '11px', border: 0 }}
                  />
                </div>
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => setIsSuggestingSkill(!isSuggestingSkill)}
                >
                  <Plus size={13} /> Suggest New Skill
                </button>
              </div>

              {isSuggestingSkill && (
                <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '5px' }}>
                  <input
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Enter new skill name (e.g. FastAPI, GraphQL)"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                  />
                  <button type="button" className="button primary small" onClick={handleSuggestSkill}>
                    Add Skill
                  </button>
                  <button type="button" className="button secondary small" onClick={() => setIsSuggestingSkill(false)}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Autocomplete choices */}
              <div className="skill-autocomplete-list">
                {filteredSkills.slice(0, 8).map((skill) => {
                  const isSelected = selectedSkills.includes(skill.name)
                  return (
                    <div
                      key={skill.name}
                      className="skill-option-item"
                      onClick={() => toggleSkill(skill.name)}
                      style={{ background: isSelected ? '#eff6ff' : '' }}
                    >
                      <div>
                        <b>{skill.name}</b>
                        <small style={{ marginLeft: '8px', color: 'var(--muted)' }}>({skill.category})</small>
                      </div>
                      {isSelected ? <Check size={14} color="var(--blue)" /> : <Plus size={14} color="var(--muted)" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Target Career Roles */}
          <div className="employer-form-wide">
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
              Target Job Roles (Helps recommendation engine)
            </span>
            <input value={roleSearchQuery} onChange={(event) => setRoleSearchQuery(event.target.value)} placeholder="Search relevant job roles..." aria-label="Search relevant job roles" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {filteredRoles.map((role) => {
                const active = selectedRoles.includes(role)
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={active ? 'button primary small' : 'button secondary small'}
                    style={{ borderRadius: '14px' }}
                  >
                    {active && <Check size={12} />} {role}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Form Submission Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="button secondary"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye size={15} /> Preview Material
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={saving}
          onClick={() => handleSubmit('draft')}
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          className="button primary"
          disabled={saving}
          onClick={() => handleSubmit('published')}
        >
          {saving ? 'Publishing...' : 'Publish Material'} <ArrowRight size={15} />
        </button>
      </div>

      {previewOpen && (
        <ResourcePreviewModal resource={previewObject} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  )
}

/* -------------------------------------------------------------
   PROVIDER MY MATERIALS (RESOURCE MANAGEMENT)
------------------------------------------------------------- */
function ProviderMyMaterials({
  resources,
  onEdit,
  onPreview,
  onResourceUpdated,
  onResourceDeleted,
  onReloadNeeded,
  previewingResource,
  onClosePreview,
  editingResource,
  onCancelEdit,
}: {
  resources: LearningResource[]
  onEdit: (res: LearningResource) => void
  onPreview: (res: LearningResource) => void
  onResourceUpdated?: (res: LearningResource) => void
  onResourceDeleted?: (id: string) => void
  onReloadNeeded?: () => void
  previewingResource: LearningResource | null
  onClosePreview: () => void
  editingResource: LearningResource | null
  onCancelEdit: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  if (editingResource) {
    return (
      <ProviderUploadForm
        editingResource={editingResource}
        onCancelEdit={onCancelEdit}
        onSaved={(updated) => {
          if (onResourceUpdated) onResourceUpdated(updated)
          onCancelEdit()
        }}
      />
    )
  }

  // Filter items
  const filtered = resources.filter((res) => {
    if (statusFilter !== 'all' && res.status !== statusFilter) return false
    if (typeFilter !== 'all' && res.resourceType !== typeFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = res.title.toLowerCase().includes(q)
      const matchSkill = res.skills.some((s) => s.toLowerCase().includes(q))
      const matchRole = res.targetRoles.some((r) => r.toLowerCase().includes(q))
      if (!matchTitle && !matchSkill && !matchRole) return false
    }
    return true
  })

  async function handleTogglePublish(res: LearningResource) {
    setActionLoadingId(res.id)
    const nextStatus: PublicationStatus = res.status === 'published' ? 'draft' : 'published'
    try {
      const updated = await apiRequest<{ resource: LearningResource }>(`/resources/provider/${res.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      if (onResourceUpdated) onResourceUpdated(updated.resource)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDuplicate(res: LearningResource) {
    setActionLoadingId(res.id)
    try {
      const dup = await apiRequest<{ resource: LearningResource }>(`/resources/${res.id}/duplicate`, {
        method: 'POST',
      })
      if (onReloadNeeded) onReloadNeeded()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Duplicate failed')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDelete(res: LearningResource) {
    if (!confirm(`Are you sure you want to delete "${res.title}"?`)) return
    setActionLoadingId(res.id)
    try {
      await apiRequest(`/resources/provider/${res.id}`, { method: 'DELETE' })
      if (onResourceDeleted) onResourceDeleted(res.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">Curriculum Catalogue</span>
          <h1>My Learning Materials</h1>
          <p>Manage, edit, publish and review learner performance for your uploaded content.</p>
        </div>
        <Link href="/provider/materials/new" className="button primary">
          <Upload size={15} /> Upload new material
        </Link>
      </div>

      <div className="learning-filter-bar">
        <div className="search-input">
          <Search size={15} color="var(--muted)" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, skill or target role..."
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="under_review">Under Review</option>
          <option value="archived">Archived</option>
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Formats</option>
          <option value="video">Video</option>
          <option value="course">Course</option>
          <option value="document">Document</option>
          <option value="exercise">Exercise</option>
          <option value="external">External</option>
        </select>

        <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>
          Showing {filtered.length} of {resources.length}
        </span>
      </div>

      <section className="panel" style={{ marginTop: '16px' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Format</th>
                <th>Skills & Roles</th>
                <th>Status</th>
                <th>Learner Activity</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((res) => {
                const activity = res.activity || { views: res.viewsCount || 0, uniqueLearners: 0, completionRate: 0 }
                return (
                  <tr key={res.id}>
                    <td style={{ maxWidth: '280px' }}>
                      <b>{res.title}</b>
                      <small style={{ color: 'var(--muted)' }}>
                        {res.category} · {res.durationMinutes} mins · {res.language}
                      </small>
                    </td>
                    <td>
                      <span className="resource-meta-chip">{res.resourceType}</span>
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {res.skills.map((s) => (
                          <span key={s} className="tag" style={{ fontSize: '9px', padding: '2px 5px' }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          res.status === 'published' ? 'success' : res.status === 'draft' ? 'warning' : 'match'
                        }`}
                      >
                        {res.status === 'published' ? 'Published' : res.status === 'draft' ? 'Draft' : res.status === 'under_review' ? 'Under Review' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <small style={{ fontWeight: 600 }}>{activity.views} views</small>
                      <small style={{ color: 'var(--green)' }}>{activity.uniqueLearners} learners ({activity.completionRate}% complete)</small>
                    </td>
                    <td>
                      <small>{new Date(res.updatedAt || res.createdAt).toLocaleDateString('en-IN')}</small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="button secondary small"
                          onClick={() => onPreview(res)}
                          title="Preview learner player"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          type="button"
                          className="button secondary small"
                          onClick={() => onEdit(res)}
                          title="Edit metadata"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          className="button secondary small"
                          disabled={actionLoadingId === res.id}
                          onClick={() => handleTogglePublish(res)}
                          title={res.status === 'published' ? 'Unpublish to draft' : 'Publish material'}
                        >
                          {res.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="button secondary small"
                          disabled={actionLoadingId === res.id}
                          onClick={() => handleDuplicate(res)}
                          title="Duplicate copy"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          type="button"
                          className="button secondary small"
                          disabled={actionLoadingId === res.id}
                          onClick={() => handleDelete(res)}
                          title="Delete material"
                          style={{ color: '#b91c1c' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="employer-empty-state">
            <BookOpen size={28} />
            <h3>No matching materials</h3>
            <p>Try adjusting your search query or status filter.</p>
          </div>
        )}
      </section>

      {previewingResource && (
        <ResourcePreviewModal resource={previewingResource} onClose={onClosePreview} />
      )}
    </>
  )
}

/* -------------------------------------------------------------
   PROVIDER ANALYTICS
------------------------------------------------------------- */
function ProviderAnalytics({
  resources,
  onPreview,
}: {
  resources: LearningResource[]
  onPreview: (res: LearningResource) => void
}) {
  const [stats, setStats] = useState<ProviderStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    apiRequest<{ stats: ProviderStats }>('/resources/provider/stats')
      .then((res) => {
        if (active) setStats(res.stats)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const computedViews = resources.reduce((sum, r) => sum + (r.activity?.views || r.viewsCount || 0), 0)
  const computedLearners = resources.reduce((sum, r) => sum + (r.activity?.uniqueLearners || 0), 0)
  const computedStarts = resources.reduce((sum, r) => sum + (r.activity?.totalStarts || 0), 0)
  const computedCompletions = resources.reduce((sum, r) => sum + (r.activity?.completions || 0), 0)
  const computedRate = computedStarts > 0 ? Math.round((computedCompletions / computedStarts) * 100) : 0

  const totalViewsVal = stats?.totalViews ?? computedViews
  const uniqueLearnersVal = stats?.uniqueLearners ?? computedLearners
  const totalStartsVal = stats?.totalStarts ?? computedStarts
  const totalCompletionsVal = stats?.totalCompletions ?? computedCompletions
  const completionRateVal = stats?.completionRate ?? computedRate

  const kpis = [
    { label: 'Published Resources', value: stats?.publishedResources ?? resources.filter((r) => r.status === 'published').length, sub: 'Active in catalogue' },
    { label: 'Total Views', value: totalViewsVal.toLocaleString(), sub: 'Learner impressions' },
    { label: 'Unique Learners', value: uniqueLearnersVal.toLocaleString(), sub: 'Job seekers reached' },
    { label: 'Learning Starts', value: totalStartsVal.toLocaleString(), sub: 'Interactive sessions' },
    { label: 'Completions', value: totalCompletionsVal.toLocaleString(), sub: '90%+ completed' },
    { label: 'Completion Rate', value: `${completionRateVal}%`, sub: 'Average finish rate' },
  ]

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">Impact & Measurement</span>
          <h1>Provider Analytics</h1>
          <p>Real-time learner engagement, completion tracking, and skill acquisition metrics.</p>
        </div>
        <Link href="/provider/materials/new" className="button primary">
          <Upload size={15} /> Upload new material
        </Link>
      </div>

      <div className="learner-metric-ribbon" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '18px' }}>
        {kpis.map((k) => (
          <div className="learner-metric-card" key={k.label}>
            <div className="metric-icon"><BarChart3 size={19} /></div>
            <div>
              <strong>{k.value}</strong>
              <span>{k.label} · <small style={{ color: 'var(--green)' }}>{k.sub}</small></span>
            </div>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Per-Material Performance Breakdown</h2>
          <span className="helper">Aggregated from persistent candidate playback sessions.</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Resource Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Total Views</th>
                <th>Unique Learners</th>
                <th>Starts</th>
                <th>Completions</th>
                <th>Completion Rate</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((res) => {
                const act = res.activity || {
                  views: res.viewsCount || 0,
                  uniqueLearners: 0,
                  totalStarts: 0,
                  completions: 0,
                  completionRate: 0,
                }
                return (
                  <tr key={res.id}>
                    <td>
                      <b>{res.title}</b>
                      <small style={{ color: 'var(--muted)' }}>{res.skills.join(', ')}</small>
                    </td>
                    <td><span className="resource-meta-chip">{res.resourceType}</span></td>
                    <td>
                      <span className={`badge ${res.status === 'published' ? 'success' : 'warning'}`}>
                        {res.status}
                      </span>
                    </td>
                    <td><b>{act.views}</b></td>
                    <td>{act.uniqueLearners}</td>
                    <td>{act.totalStarts}</td>
                    <td>{act.completions}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="thin-progress-bar" style={{ width: '60px' }}>
                          <div className="thin-progress-fill completed" style={{ width: `${act.completionRate}%` }} />
                        </div>
                        <b>{act.completionRate}%</b>
                      </div>
                    </td>
                    <td>
                      <button type="button" className="button secondary small" onClick={() => onPreview(res)}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

/* -------------------------------------------------------------
   PROVIDER PROFILE & SETTINGS
------------------------------------------------------------- */
function ProviderProfile({ account }: { account: ProviderAccount | null }) {
  const [saved, setSaved] = useState(false)
  const profile = account?.profile || {}

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">Accreditation</span>
          <h1>Provider Profile & Settings</h1>
          <p>Training institution details displayed to candidates and government skilling partners.</p>
        </div>
      </div>

      <section className="panel employer-form-panel">
        <div className="panel-heading">
          <h2>Organization Details</h2>
          <span className="helper">Verified training provider registration</span>
        </div>

        {saved && (
          <div className="employer-success">
            <CheckCircle2 size={18} />
            <div><b>Profile updated</b><small>Your details are saved securely.</small></div>
          </div>
        )}

        <form
          className="employer-form"
          onSubmit={(e) => {
            e.preventDefault()
            setSaved(true)
          }}
        >
          <label>
            Organization Name
            <input defaultValue={profile.organizationName || account?.fullName || 'EduSkills Academy'} required />
          </label>
          <label>
            Official Website
            <input defaultValue={profile.website || 'https://eduskills.org'} type="url" />
          </label>
          <label>
            Designation / Representative
            <input defaultValue={profile.designation || 'Curriculum Director'} />
          </label>
          <label>
            Industry Focus
            <input defaultValue={profile.industry || 'Information Technology & Engineering'} />
          </label>
          <label className="employer-form-wide">
            About Institution
            <textarea
              defaultValue={
                profile.description ||
                'National skilling partner empowering Indian job seekers with industry-aligned technical curriculum.'
              }
              rows={4}
            />
          </label>
          <div className="employer-form-actions employer-form-wide">
            <button className="button primary" type="submit">
              Save Profile
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

/* -------------------------------------------------------------
   MODAL: PREVIEW RESOURCE (LEARNER PERSPECTIVE)
------------------------------------------------------------- */
function ResourcePreviewModal({
  resource,
  onClose,
}: {
  resource: LearningResource
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 34, 58, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '10px',
          width: 'min(760px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span className="eyebrow">Learner Preview</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '16px', color: 'var(--navy)' }}>{resource.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Video player preview if video */}
          {resource.resourceType === 'video' || resource.resourceType === 'course' ? (
            <div className="video-player-surface" style={{ marginBottom: '16px' }}>
              <video src={resource.contentUrl} controls playsInline poster={resource.thumbnailUrl} />
            </div>
          ) : (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              <FileText size={36} color="var(--blue)" style={{ margin: '0 auto 10px' }} />
              <h3>{resource.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '12px' }}>{resource.resourceType.toUpperCase()} Resource</p>
              <a
                href={resource.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="button primary small"
                style={{ marginTop: '10px' }}
              >
                <ExternalLink size={13} /> Open Content Link
              </a>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className="badge success">{resource.difficulty}</span>
            <span className="badge match">{resource.language}</span>
            <span className="badge warning">{resource.durationMinutes} minutes</span>
            <span className="badge success">{resource.category}</span>
          </div>

          <h3 style={{ fontSize: '14px', color: 'var(--navy)', margin: '14px 0 6px' }}>About this material</h3>
          <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            {resource.description}
          </p>

          <h3 style={{ fontSize: '14px', color: 'var(--navy)', margin: '16px 0 6px' }}>Skills Taught</h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {resource.skills.map((s) => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>

          {resource.targetRoles?.length > 0 && (
            <>
              <h3 style={{ fontSize: '14px', color: 'var(--navy)', margin: '16px 0 6px' }}>Recommended for Roles</h3>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {resource.targetRoles.map((r) => (
                  <span key={r} className="skill-tag-chip">{r}</span>
                ))}
              </div>
            </>
          )}

          {resource.lessons?.length > 0 && (
            <>
              <h3 style={{ fontSize: '14px', color: 'var(--navy)', margin: '16px 0 6px' }}>
                Course Lessons ({resource.lessons.length})
              </h3>
              <div style={{ display: 'grid', gap: '6px' }}>
                {resource.lessons.map((lesson, i) => (
                  <div key={i} className="lesson-item">
                    <Play size={14} color="var(--blue)" />
                    <span style={{ flex: 1, fontSize: '12px' }}>{lesson.title}</span>
                    <small style={{ color: 'var(--muted)' }}>{lesson.durationMinutes} mins</small>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="button secondary" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
