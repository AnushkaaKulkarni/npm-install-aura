'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, BriefcaseBusiness, Check, Heart, MapPin, RefreshCw, UserRound } from 'lucide-react'

type CandidateJob = {
  id: string
  title: string
  department: string
  location: string
  workMode: string
  employmentType: string
  experience: string
  salary: string
  deadline: string
  requiredSkills: string[]
  eligible?: boolean
  matchScore?: number | null
  missingSkills?: string[]
  saved?: boolean
  employer: { name: string; industry: string }
}

type CandidateApplication = {
  id: string
  status: string
  coverNote: string
  createdAt: string
  job: CandidateJob | null
}

type CandidateDashboard = {
  candidate: { fullName: string; location: string }
  profileCompletion: number
  stats: {
    eligibleOpportunities: number
    strongMatches: number
    applicationsSubmitted: number
    skillsToImprove: number
  }
  applications: CandidateApplication[]
  savedJobs: CandidateJob[]
  recommendations: CandidateJob[]
  skillGaps: string[]
}

type ProfileRecord = Record<string, unknown>
type CandidateProfileData = {
  account: { fullName: string; email: string; phone: string }
  candidate: ProfileRecord
  completion: number
}

type CandidateSkillAnalysis = {
  source: 'saved-profile' | 'sample-preview'
  preview: boolean
  profileSkills: { name: string; evidenceSources: string[]; aliases: string[] }[]
  targetTitles: string[]
  availableOpenings: number
  analyzedOpenings: number
  targetRoles: {
    title: string
    openings: number
    eligibleOpenings: number
    ineligibleOpenings: number
    unknownEligibilityOpenings: number
    experienceYears: number | null
    requiredSkillCount: number
    coveredSkillCount: number
    coveredSkills: string[]
    currentMatchScore: number | null
    missingSkills: { name: string; openings: number; covered: boolean }[]
  }[]
  missingSkills: {
    name: string
    requiredInOpenings: number
    openingSharePercent: number
    priority: 'High' | 'Medium' | 'Focused'
    roles: { title: string; openings: number; currentMatchScore: number | null; projectedMatchScore: number | null; projectedMatchLift: number | null }[]
  }[]
  learningRecommendations: {
    skill: string
    priority: 'High' | 'Medium' | 'Focused'
    requiredInOpenings: number
    roles: { title: string; openings: number; currentMatchScore: number | null; projectedMatchScore: number | null; projectedMatchLift: number | null }[]
    bestRole: string | null
    currentMatchScore: number | null
    projectedMatchScore: number | null
    projectedMatchLift: number | null
    explanation: string
    practicePlan: string[]
    catalogConnected: boolean
  }[]
  limitations: string[]
}

type ApiResult<T> = T & { error?: string }

async function candidateRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
  if (!baseUrl) throw new Error('The API is not configured. Set NEXT_PUBLIC_API_URL and try again.')

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    })
  } catch {
    throw new Error('Unable to reach the API. Check that the backend is running and try again.')
  }

  let result: ApiResult<T>
  try {
    result = await response.json()
  } catch {
    throw new Error('The API returned an invalid response.')
  }
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.')
  return result
}

function dateLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function CandidateJobCard({
  job,
  onSave,
  onApply,
  busy,
  showMissingSkills = false,
}: {
  job: CandidateJob
  onSave?: (job: CandidateJob) => void
  onApply?: (job: CandidateJob) => void
  busy?: boolean
  showMissingSkills?: boolean
}) {
  return <article className="candidate-job-card">
    <div className="candidate-job-heading">
      <div className="candidate-company-mark">{job.employer.name.trim().slice(0, 2).toUpperCase() || 'CO'}</div>
      <div className="candidate-job-title">
        <h3>{job.title}</h3>
        <p>{job.employer.name}{job.employer.industry ? ` · ${job.employer.industry}` : ''}</p>
      </div>
      {job.matchScore != null && <span className="candidate-match-score">{job.matchScore}% skill match</span>}
    </div>
    <div className="candidate-job-meta">
      <span><MapPin size={14}/>{job.location || 'Location not specified'}</span>
      <span>{job.workMode || 'Work mode not specified'}</span>
      <span>{job.employmentType || 'Employment type not specified'}</span>
      <span>{job.experience}</span>
      <span>{job.salary}</span>
    </div>
    <div className="candidate-job-skills">{job.requiredSkills.map(skill => <span key={skill}>{skill}</span>)}</div>
    {showMissingSkills && job.missingSkills && job.missingSkills.length > 0 && <p className="candidate-skill-gaps"><b>Skills to build:</b> {job.missingSkills.join(', ')}</p>}
    <div className="candidate-job-footer">
      <small>Apply by {dateLabel(job.deadline)}</small>
      <div>
        {onSave && <button type="button" className={`candidate-save-action${job.saved ? ' saved' : ''}`} onClick={() => onSave(job)} disabled={busy} aria-label={job.saved ? 'Remove saved job' : 'Save job'}>
          <Heart size={15} fill={job.saved ? 'currentColor' : 'none'}/>{job.saved ? 'Saved' : 'Save'}
        </button>}
        {onApply && <button type="button" className="button primary small" onClick={() => onApply(job)} disabled={busy}>{busy ? 'Applying…' : 'Apply now'}</button>}
      </div>
    </div>
  </article>
}

function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="candidate-empty-state"><span><BriefcaseBusiness size={21}/></span><h3>{title}</h3><p>{children}</p></div>
}

const profileSections = [
  { id: 'personal', label: 'Personal details' },
  { id: 'contact', label: 'Contact & links' },
  { id: 'preferences', label: 'Job preferences' },
  { id: 'summary', label: 'Professional summary' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Work experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'languages', label: 'Languages' },
  { id: 'resume', label: 'Resume details' },
] as const

type ProfileSection = typeof profileSections[number]['id']
type EditorField = { key: string; label: string; type?: 'number' | 'url' | 'date'; multiline?: boolean; checkbox?: boolean; options?: string[] }

const profileFields: Record<ProfileSection, EditorField[]> = {
  personal: [
    { key: 'preferredDisplayName', label: 'Name to display' },
    { key: 'headline', label: 'Professional headline' },
    { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { key: 'gender', label: 'Gender' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State / region' },
    { key: 'country', label: 'Country' },
    { key: 'postalCode', label: 'Postal code' },
  ],
  contact: [
    { key: 'alternatePhone', label: 'Alternate phone' },
    { key: 'linkedinUrl', label: 'LinkedIn URL', type: 'url' },
    { key: 'githubUrl', label: 'GitHub URL', type: 'url' },
    { key: 'portfolioUrl', label: 'Portfolio URL', type: 'url' },
  ],
  preferences: [
    { key: 'desiredJobTitles', label: 'Desired job titles (comma separated)' },
    { key: 'preferredIndustries', label: 'Preferred industries (comma separated)' },
    { key: 'preferredEmploymentTypes', label: 'Employment types (comma separated)' },
    { key: 'preferredWorkModes', label: 'Work modes: On-site, Hybrid, Remote (comma separated)' },
    { key: 'preferredLocations', label: 'Preferred locations (comma separated)' },
    { key: 'preferredCompanyTypes', label: 'Preferred company types (comma separated)' },
    { key: 'preferredJobCategories', label: 'Preferred job categories (comma separated)' },
    { key: 'preferredShifts', label: 'Preferred shifts (comma separated)' },
    { key: 'expectedSalaryMin', label: 'Minimum expected annual salary (INR)', type: 'number' },
    { key: 'expectedSalaryMax', label: 'Maximum expected annual salary (INR)', type: 'number' },
    { key: 'currentSalary', label: 'Current annual salary (INR)', type: 'number' },
    { key: 'availability', label: 'Availability / notice period' },
    { key: 'careerLevel', label: 'Career level' },
    { key: 'willingToRelocate', label: 'I am willing to relocate', checkbox: true },
  ],
  summary: [
    { key: 'about', label: 'About you', multiline: true },
    { key: 'careerObjective', label: 'Career objective', multiline: true },
    { key: 'experienceYears', label: 'Years of experience', type: 'number' },
    { key: 'employmentStatus', label: 'Employment status' },
    { key: 'currentJobTitle', label: 'Current / recent job title' },
    { key: 'currentCompany', label: 'Current / recent company' },
    { key: 'industryExperience', label: 'Industry experience (comma separated)' },
  ],
  education: [],
  experience: [],
  skills: [],
  projects: [],
  certifications: [],
  achievements: [],
  languages: [],
  resume: [
    { key: 'fileName', label: 'Resume file name' },
    { key: 'url', label: 'Resume link', type: 'url' },
  ],
}

const recordFields: Partial<Record<ProfileSection, EditorField[]>> = {
  education: [
    { key: 'level', label: 'Education level' },
    { key: 'degree', label: 'Degree / qualification' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'institution', label: 'Institution' },
    { key: 'university', label: 'University / board' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'currentlyStudying', label: 'Currently studying', checkbox: true },
    { key: 'grade', label: 'Grade / score' },
    { key: 'gradeScale', label: 'Grade scale' },
    { key: 'coursework', label: 'Relevant coursework', multiline: true },
  ],
  experience: [
    { key: 'title', label: 'Job title' },
    { key: 'company', label: 'Company' },
    { key: 'employmentType', label: 'Employment type', options: ['', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'] },
    { key: 'location', label: 'Location' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'currentlyWorking', label: 'Currently working here', checkbox: true },
    { key: 'description', label: 'Responsibilities', multiline: true },
    { key: 'achievements', label: 'Achievements', multiline: true },
    { key: 'skills', label: 'Skills used (comma separated)' },
  ],
  skills: [
    { key: 'name', label: 'Skill' },
    { key: 'category', label: 'Category', options: ['Technical', 'Programming language', 'Framework', 'Database', 'Tool', 'Cloud', 'Soft skill', 'Domain'] },
    { key: 'proficiency', label: 'Proficiency', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    { key: 'experienceMonths', label: 'Experience in months', type: 'number' },
    { key: 'lastUsed', label: 'Last used' },
  ],
  projects: [
    { key: 'title', label: 'Project name' },
    { key: 'role', label: 'Your role' },
    { key: 'description', label: 'Project description', multiline: true },
    { key: 'problemSolved', label: 'Problem solved', multiline: true },
    { key: 'technologies', label: 'Technologies (comma separated)' },
    { key: 'githubUrl', label: 'GitHub URL', type: 'url' },
    { key: 'demoUrl', label: 'Live demo URL', type: 'url' },
    { key: 'outcomes', label: 'Outcomes', multiline: true },
  ],
  certifications: [
    { key: 'name', label: 'Certification' },
    { key: 'issuer', label: 'Issuing organization' },
    { key: 'issueDate', label: 'Issue date' },
    { key: 'expiryDate', label: 'Expiry date' },
    { key: 'credentialId', label: 'Credential ID' },
    { key: 'credentialUrl', label: 'Credential URL', type: 'url' },
  ],
  achievements: [
    { key: 'title', label: 'Achievement' },
    { key: 'organization', label: 'Organization' },
    { key: 'date', label: 'Date' },
    { key: 'description', label: 'Description', multiline: true },
    { key: 'url', label: 'Link', type: 'url' },
  ],
  languages: [
    { key: 'name', label: 'Language' },
    { key: 'proficiency', label: 'Proficiency', options: ['Basic', 'Conversational', 'Professional', 'Fluent', 'Native'] },
  ],
}

function displayFieldValue(value: unknown, key: string) {
  if (Array.isArray(value)) return value.join(', ')
  if (value == null) return ''
  if (key === 'currentSalary' && typeof value === 'number') return String(value)
  return String(value)
}

function rowsFromProfile(value: unknown, fields: EditorField[]) {
  if (!Array.isArray(value)) return []
  return value.map(item => {
    const record = item && typeof item === 'object' ? item as ProfileRecord : {}
    return Object.fromEntries(fields.map(field => [field.key, field.checkbox ? Boolean(record[field.key]) : displayFieldValue(record[field.key], field.key)]))
  })
}

function emptyRow(fields: EditorField[]) {
  return Object.fromEntries(fields.map(field => [field.key, field.checkbox ? false : '']))
}

function CandidateSkillAnalysisView({
  analysis,
  learningView,
  onPreviewChange,
}: {
  analysis: CandidateSkillAnalysis
  learningView: boolean
  onPreviewChange: (preview: boolean) => void
}) {
  const [filter, setFilter] = useState('')
  const recommendations = analysis.learningRecommendations.filter(item => (
    `${item.skill} ${item.roles.map(role => role.title).join(' ')}`.toLowerCase().includes(filter.toLowerCase())
  ))

  return <>
    <div className="dashboard-heading candidate-analysis-heading">
      <div>
        <span className="eyebrow">{analysis.preview ? 'Sample profile · preview only' : 'Evidence from your saved profile'}</span>
        <h1>{learningView ? 'Recommended Learning' : 'Detailed Skill Gap Analysis'}</h1>
        <p>{learningView
          ? 'See what to learn next and which target roles each skill can improve.'
          : 'Compare skills in your profile with requirements from active jobs in your target roles.'}</p>
      </div>
      <button type="button" className={`button ${analysis.preview ? 'secondary' : 'primary'}`} onClick={() => onPreviewChange(!analysis.preview)}>
        {analysis.preview ? 'Return to my saved profile' : 'Try sample profile (preview only)'}
      </button>
    </div>
    {analysis.preview && <div className="candidate-preview-banner" role="status">
      This is a fictional sample profile and sample job data for testing the analysis. Nothing is saved to your account.
    </div>}
    <div className="candidate-analysis-summary">
      {[
        [String(analysis.profileSkills.length), 'Skills found in profile'],
        [String(analysis.targetRoles.length), 'Target roles compared'],
        [String(analysis.availableOpenings), 'Active openings analyzed'],
        [String(analysis.missingSkills.length), 'Distinct skill gaps'],
      ].map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
    </div>
    {analysis.targetTitles.length > 0 && <p className="candidate-analysis-targets"><b>Your target roles:</b> {analysis.targetTitles.join(' · ')}</p>}

    {!learningView && <>
      <section className="panel candidate-analysis-panel">
        <div className="panel-heading"><div><span className="eyebrow">Role-by-role comparison</span><h2>Where your current profile stands</h2></div></div>
        {analysis.targetRoles.length ? <div className="candidate-role-analysis-list">{analysis.targetRoles.map(role => <article className="candidate-role-analysis" key={role.title}>
          <div className="candidate-role-analysis-heading">
            <div><h3>{role.title}</h3><p>{role.openings} active opening{role.openings === 1 ? '' : 's'} with {role.requiredSkillCount} distinct listed skills</p></div>
            <strong>{role.currentMatchScore == null ? 'No skill data' : `${role.currentMatchScore}% coverage`}</strong>
          </div>
          {role.currentMatchScore != null && <div className="candidate-completion-track" role="progressbar" aria-valuenow={role.currentMatchScore} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${role.currentMatchScore}%` }}/></div>}
          <p className="candidate-role-eligibility">
            Experience check: {role.unknownEligibilityOpenings > 0
              ? `unknown for ${role.unknownEligibilityOpenings} opening${role.unknownEligibilityOpenings === 1 ? '' : 's'}; add experience details to assess`
              : `${role.eligibleOpenings} of ${role.openings} opening${role.openings === 1 ? '' : 's'} meet the posted experience range`}
          </p>
          {role.coveredSkills.length > 0 && <p className="candidate-role-covered"><b>Matched requirements:</b> {role.coveredSkills.join(', ')}</p>}
          {role.missingSkills.length > 0
            ? <div className="candidate-job-skills">{role.missingSkills.map(skill => <span key={skill.name}>{skill.name} · {skill.openings}/{role.openings}</span>)}</div>
            : <p className="candidate-empty-inline">{role.requiredSkillCount ? 'All distinct listed role skills appear in your profile evidence.' : 'No required skills were provided on the active postings.'}</p>}
        </article>)}</div> : <EmptyState title={analysis.availableOpenings ? 'No active openings for your target titles' : 'No active job requirements to compare'}>
          {analysis.targetTitles.length
            ? 'Your saved target-role names do not currently match an active job title. Check the sample preview, or update your preferences as roles become available.'
            : 'Save desired job titles in your profile or check back after employers publish active jobs. The sample preview is available to test the analysis.'}
        </EmptyState>}
      </section>
      <section className="panel candidate-analysis-panel">
        <div className="panel-heading"><div><span className="eyebrow">Prioritized gaps</span><h2>Skills most often requested in your target roles</h2></div></div>
        <p className="candidate-priority-guide"><b>Priority method:</b> High means a skill appears in at least 3 postings or in at least half of multiple target postings; Medium means it appears in 2 postings or at least 25% of target postings; Focused means it appears in fewer.</p>
        {analysis.missingSkills.length ? <div className="candidate-gap-table-wrap"><table className="candidate-gap-table"><thead><tr><th>Priority</th><th>Skill</th><th>Openings requesting it</th><th>Role impact</th></tr></thead><tbody>
          {analysis.missingSkills.map(skill => <tr key={skill.name}><td><span className={`candidate-priority ${skill.priority.toLowerCase()}`}>{skill.priority}</span></td><td><b>{skill.name}</b></td><td>{skill.requiredInOpenings} of {analysis.availableOpenings} ({skill.openingSharePercent}%)</td><td>{skill.roles.map(role => role.title).join(', ')}</td></tr>)}
        </tbody></table></div> : <EmptyState title="No identified skill gaps">The active job requirements for your target roles are already covered by profile skills, or there are no postings to compare.</EmptyState>}
      </section>
      <section className="panel candidate-analysis-panel">
        <div className="panel-heading"><div><span className="eyebrow">Profile evidence counted</span><h2>Skills already represented</h2></div></div>
        {analysis.profileSkills.length ? <div className="candidate-profile-skill-list">{analysis.profileSkills.map(skill => <article key={skill.name}><b>{skill.name}</b><small>{skill.evidenceSources.join(' · ')}</small></article>)}</div> : <p className="candidate-empty-inline">No skills were found in the saved profile, project technologies, or work-experience skills.</p>}
      </section>
    </>}

    {learningView && <section className="panel candidate-analysis-panel">
      <div className="panel-heading"><div><span className="eyebrow">Study in demand order</span><h2>Learning paths linked to roles</h2></div><label className="candidate-learning-filter"><span className="sr-only">Filter learning suggestions</span><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Filter by skill or role"/></label></div>
      {recommendations.length ? <div className="candidate-learning-list">{recommendations.map((item, index) => <article className="candidate-learning-card" key={item.skill}>
        <div className="candidate-learning-title"><span>{String(index + 1).padStart(2, '0')}</span><div><b>{item.skill}</b><small>{item.requiredInOpenings} active opening{item.requiredInOpenings === 1 ? '' : 's'} request this skill · {item.priority} priority</small></div><span className={`candidate-priority ${item.priority.toLowerCase()}`}>{item.priority}</span></div>
        <p>{item.explanation}</p>
        <div className="candidate-learning-impact">
          {item.roles.map(role => <div key={role.title}><b>{role.title}</b><small>
            {role.currentMatchScore == null || role.projectedMatchScore == null
              ? `${role.openings} opening${role.openings === 1 ? '' : 's'} affected · skill coverage unavailable`
                : `${role.currentMatchScore}% current skill coverage → ${role.projectedMatchScore}% if this skill is added (+${role.projectedMatchLift ?? 0} percentage points)`}
          </small></div>)}
        </div>
        {item.bestRole && <p className="candidate-learning-primary-role"><b>Best single-role improvement:</b> {item.bestRole}
          {item.projectedMatchLift == null ? '' : ` · projected skill coverage lift ${item.projectedMatchLift} percentage points`}
        </p>}
        <details><summary>Suggested practice plan for {item.skill}</summary><ol>{item.practicePlan.map(step => <li key={step}>{step}</li>)}</ol></details>
      </article>)}</div> : <EmptyState title="No learning gaps to recommend">
        {analysis.availableOpenings ? 'No missing skills were identified for the current target roles.' : 'No active openings match this profile’s target roles yet. Try the sample profile preview or check back as employers post jobs.'}
      </EmptyState>}
    </section>}

    <aside className="candidate-analysis-limits"><b>How to interpret these results</b><ul>{analysis.limitations.map(limitation => <li key={limitation}>{limitation}</li>)}</ul></aside>
  </>
}

function CandidateProfileEditor({ profile, onUpdated }: { profile: CandidateProfileData; onUpdated: (profile: CandidateProfileData) => void }) {
  const [section, setSection] = useState<ProfileSection>('personal')
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [rows, setRows] = useState<Array<Record<string, string | boolean>>>([])
  const [savedValues, setSavedValues] = useState<Record<string, string | boolean>>({})
  const [savedRows, setSavedRows] = useState<Array<Record<string, string | boolean>>>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const candidate = profile.candidate
  const scalarFields = profileFields[section]
  const currentRecords = recordFields[section]

  useEffect(() => {
    const source = section === 'resume' && candidate.resume && typeof candidate.resume === 'object'
      ? candidate.resume as ProfileRecord
      : candidate
    const nextValues = Object.fromEntries(scalarFields.map(field => {
      if (field.checkbox) return [field.key, Boolean(source[field.key])]
      return [field.key, displayFieldValue(source[field.key], field.key)]
    }))
    const nextRows = currentRecords ? rowsFromProfile(candidate[section], currentRecords) : []
    setValues(nextValues)
    setRows(nextRows)
    setSavedValues(nextValues)
    setSavedRows(nextRows)
  }, [candidate, currentRecords, scalarFields, section])

  const hasUnsavedChanges = JSON.stringify(values) !== JSON.stringify(savedValues) || JSON.stringify(rows) !== JSON.stringify(savedRows)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const data: Record<string, unknown> = {}
      for (const field of scalarFields) {
        const value = values[field.key]
        if (field.checkbox) data[field.key] = Boolean(value)
        else if (['desiredJobTitles', 'preferredIndustries', 'preferredEmploymentTypes', 'preferredWorkModes', 'preferredLocations', 'preferredCompanyTypes', 'preferredJobCategories', 'preferredShifts', 'industryExperience'].includes(field.key)) {
          data[field.key] = String(value || '').split(',').map(item => item.trim()).filter(Boolean)
        } else if (['expectedSalaryMin', 'expectedSalaryMax', 'currentSalary', 'experienceYears'].includes(field.key)) {
          data[field.key] = value === '' ? null : Number(value)
        } else data[field.key] = value
      }
      if (section === 'resume') {
        data.resume = { fileName: data.fileName, url: data.url }
        delete data.fileName
        delete data.url
      }
      else if (currentRecords) {
        data[section] = rows.filter(row => Object.values(row).some(value => typeof value === 'boolean' ? value : String(value).trim())).map(row => Object.fromEntries(currentRecords.map(field => {
          const value = row[field.key] ?? ''
          if (field.checkbox) return [field.key, Boolean(value)]
          if (field.key === 'technologies' || field.key === 'skills') return [field.key, String(value).split(',').map(item => item.trim()).filter(Boolean)]
          if (field.key === 'experienceMonths') return [field.key, value === '' ? 0 : Number(value)]
          return [field.key, value]
        })))
      }
      const result = await candidateRequest<{ profile: CandidateProfileData }>(`/candidate/profile/${section}`, {
        method: 'PATCH',
        body: JSON.stringify({ data }),
      })
      onUpdated(result.profile)
      setNotice('Section saved to your profile.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save this profile section.')
    } finally {
      setSaving(false)
    }
  }

  function updateRow(index: number, key: string, value: string | boolean) {
    setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  }

  return <div className="candidate-profile-layout">
    <aside className="candidate-profile-nav" aria-label="Profile sections">
      {profileSections.map(item => <button type="button" key={item.id} className={section === item.id ? 'active' : ''} onClick={() => {
        if (item.id === section) return
        if (hasUnsavedChanges && !window.confirm('Discard unsaved changes to this section?')) return
        setError('')
        setNotice('')
        setSection(item.id)
      }}>
        <span>{item.label}</span>{Object.keys(candidate).includes(item.id) && Array.isArray(candidate[item.id]) && (candidate[item.id] as unknown[]).length > 0 ? <Check size={14}/> : null}
      </button>)}
    </aside>
    <section className="panel candidate-profile-editor">
      <div className="candidate-profile-account">
        <span className="candidate-profile-avatar"><UserRound size={22}/></span>
        <div><h2>{profile.account.fullName}</h2><p>{profile.account.email} · {profile.account.phone}</p></div>
        <span className="candidate-profile-completion">{profile.completion}% complete</span>
      </div>
      <form onSubmit={save}>
        <div className="candidate-profile-section-heading">
          <h3>{profileSections.find(item => item.id === section)?.label}</h3>
          <p>Update this section and save it to your candidate profile.</p>
        </div>
        {section === 'resume' && <p className="candidate-resume-note">Resume attachment storage is not configured in this project. You can record a filename and an existing secure link here; this form does not upload or store a file.</p>}
        {scalarFields.length > 0 && <div className="candidate-profile-fields">
          {scalarFields.map(field => <label className={field.multiline ? 'candidate-field full' : 'candidate-field'} key={field.key}>
            <span>{field.label}</span>
            {field.checkbox
              ? <input type="checkbox" checked={Boolean(values[field.key])} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.checked }))}/>
              : field.options
                ? <select value={String(values[field.key] ?? '')} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))}>{field.options.map(option => <option value={option} key={option}>{option || 'Select an option'}</option>)}</select>
              : field.multiline
                ? <textarea value={String(values[field.key] ?? '')} rows={4} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))}/>
                : <input type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} step={field.key === 'experienceYears' ? 0.5 : 1} value={String(values[field.key] ?? '')} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))}/>}
          </label>)}
        </div>}
        {currentRecords && <div className="candidate-profile-records">
          {rows.map((row, index) => <fieldset key={index}>
            <legend>{profileSections.find(item => item.id === section)?.label || 'Record'} {index + 1}</legend>
            <button type="button" className="candidate-remove-record" onClick={() => setRows(current => current.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
            <div className="candidate-profile-fields">
              {currentRecords.map(field => <label className={field.multiline ? 'candidate-field full' : 'candidate-field'} key={field.key}>
                <span>{field.label}</span>
                {field.checkbox
                  ? <input type="checkbox" checked={Boolean(row[field.key])} onChange={event => updateRow(index, field.key, event.target.checked)}/>
                  : field.options
                    ? <select value={String(row[field.key] ?? '')} onChange={event => updateRow(index, field.key, event.target.value)}>{field.options.map(option => <option value={option} key={option}>{option || 'Select an option'}</option>)}</select>
                  : field.multiline
                    ? <textarea rows={3} value={String(row[field.key] ?? '')} onChange={event => updateRow(index, field.key, event.target.value)}/>
                    : <input type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} value={String(row[field.key] ?? '')} onChange={event => updateRow(index, field.key, event.target.value)}/>}
              </label>)}
            </div>
          </fieldset>)}
          <button type="button" className="button secondary small" onClick={() => setRows(current => [...current, emptyRow(currentRecords)])}>Add {profileSections.find(item => item.id === section)?.label.toLowerCase().replace(/s$/, '')}</button>
        </div>}
        {error && <p className="candidate-error" role="alert">{error}</p>}
        {notice && <p className="candidate-success" role="status">{notice}</p>}
        <div className="candidate-profile-actions">{hasUnsavedChanges && <button className="button secondary" type="button" disabled={saving} onClick={() => { setValues(savedValues); setRows(savedRows); setError(''); setNotice('Unsaved changes were discarded.') }}>Cancel changes</button>}<button className="button primary" type="submit" disabled={saving || !hasUnsavedChanges}>{saving ? 'Saving…' : 'Save section'}</button></div>
      </form>
    </section>
  </div>
}

export function CandidateWorkspace({ section }: { section: string }) {
  const [dashboard, setDashboard] = useState<CandidateDashboard | null>(null)
  const [applications, setApplications] = useState<CandidateApplication[]>([])
  const [savedJobs, setSavedJobs] = useState<CandidateJob[]>([])
  const [profile, setProfile] = useState<CandidateProfileData | null>(null)
  const [skillAnalysis, setSkillAnalysis] = useState<CandidateSkillAnalysis | null>(null)
  const [analysisPreview, setAnalysisPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyJobId, setBusyJobId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotice('')
    setDashboard(null)
    setApplications([])
    setSavedJobs([])
    setProfile(null)
    setSkillAnalysis(null)
    try {
      if (section === 'My Profile') {
        const result = await candidateRequest<{ profile: CandidateProfileData }>('/candidate/profile')
        setProfile(result.profile)
      } else if (section === 'My Applications') {
        const result = await candidateRequest<{ applications: CandidateApplication[] }>('/candidate/applications')
        setApplications(result.applications)
      } else if (section === 'Saved Jobs') {
        const result = await candidateRequest<{ jobs: CandidateJob[] }>('/candidate/saved-jobs')
        setSavedJobs(result.jobs)
      } else if (section === 'Skill Gap Analysis' || section === 'Recommended Learning / Learning Hub') {
        const path = analysisPreview ? '/candidate/skill-gap-analysis/preview' : '/candidate/skill-gap-analysis'
        const result = await candidateRequest<{ analysis: CandidateSkillAnalysis }>(path)
        setSkillAnalysis(result.analysis)
      } else {
        const result = await candidateRequest<{ dashboard: CandidateDashboard }>('/candidate/dashboard')
        setDashboard(result.dashboard)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load your candidate workspace.')
    } finally {
      setLoading(false)
    }
  }, [analysisPreview, section, refreshKey])

  useEffect(() => { void load() }, [load])

  function toggleAnalysisPreview(preview: boolean) {
    setAnalysisPreview(preview)
    setRefreshKey(value => value + 1)
  }

  async function apply(job: CandidateJob) {
    setBusyJobId(job.id)
    setError('')
    setNotice('')
    try {
      await candidateRequest('/candidate/applications', { method: 'POST', body: JSON.stringify({ jobId: job.id }) })
      setNotice(`Your application for ${job.title} has been submitted.`)
      setRefreshKey(value => value + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit your application.')
    } finally {
      setBusyJobId('')
    }
  }

  async function toggleSaved(job: CandidateJob) {
    setBusyJobId(job.id)
    setError('')
    setNotice('')
    try {
      const saved = !job.saved
      await candidateRequest(`/candidate/saved-jobs/${encodeURIComponent(job.id)}`, { method: saved ? 'PUT' : 'DELETE' })
      if (section === 'Saved Jobs') setSavedJobs(current => current.filter(item => item.id !== job.id))
      setDashboard(current => current ? {
        ...current,
        savedJobs: saved ? [job, ...current.savedJobs.filter(item => item.id !== job.id)] : current.savedJobs.filter(item => item.id !== job.id),
        recommendations: current.recommendations.map(item => item.id === job.id ? { ...item, saved } : item),
      } : current)
      setNotice(saved ? 'Job saved to your profile.' : 'Job removed from saved jobs.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update saved jobs.')
    } finally {
      setBusyJobId('')
    }
  }

  if (loading) return <div className="candidate-workspace-state" role="status">Loading your candidate workspace…</div>
  if (error && !dashboard && !profile && !applications.length && !savedJobs.length) return <div className="candidate-workspace-state"><p className="candidate-error" role="alert">{error}</p><button className="button secondary" onClick={() => setRefreshKey(value => value + 1)}><RefreshCw size={15}/> Try again</button></div>

  if (section === 'My Profile') return <><div className="dashboard-heading"><div><span className="eyebrow">Candidate workspace</span><h1>My Profile</h1><p>Build a complete, accurate profile employers can use to understand your experience.</p></div></div>{profile ? <CandidateProfileEditor profile={profile} onUpdated={setProfile}/> : null}</>

  if (section === 'Skill Gap Analysis' || section === 'Recommended Learning / Learning Hub') return skillAnalysis
    ? <CandidateSkillAnalysisView analysis={skillAnalysis} learningView={section === 'Recommended Learning / Learning Hub'} onPreviewChange={toggleAnalysisPreview}/>
    : <div className="candidate-workspace-state"><p className="candidate-error" role="alert">{error || 'Unable to load your skill analysis.'}</p><button className="button secondary" onClick={() => setRefreshKey(value => value + 1)}><RefreshCw size={15}/> Try again</button></div>

  if (section === 'My Applications') return <><div className="dashboard-heading"><div><span className="eyebrow">Your job search</span><h1>My Applications</h1><p>Review the applications you have submitted and their current status.</p></div><Link className="button primary" href="/candidate/opportunities">Find opportunities <ArrowRight size={15}/></Link></div>
    {error && <p className="candidate-error" role="alert">{error}</p>}{notice && <p className="candidate-success" role="status">{notice}</p>}
    {applications.length ? <div className="candidate-application-list">{applications.map(application => <article className="candidate-application-card" key={application.id}><div><span className="eyebrow">{application.job?.employer.name || 'Company'}</span><h2>{application.job?.title || 'Job posting no longer available'}</h2><p>Applied {dateLabel(application.createdAt)}{application.job?.location ? ` · ${application.job.location}` : ''}</p></div><span className="candidate-application-status">{application.status}</span></article>)}</div> : <EmptyState title="No applications yet">When you apply to an active opportunity, it will appear here.</EmptyState>}</>

  if (section === 'Saved Jobs') return <><div className="dashboard-heading"><div><span className="eyebrow">Your job search</span><h1>Saved Jobs</h1><p>Active opportunities you have saved for later.</p></div><Link className="button primary" href="/candidate/opportunities">Browse opportunities <ArrowRight size={15}/></Link></div>
    {error && <p className="candidate-error" role="alert">{error}</p>}{notice && <p className="candidate-success" role="status">{notice}</p>}
    {savedJobs.length ? <div className="candidate-job-list">{savedJobs.map(job => <CandidateJobCard key={job.id} job={{ ...job, saved: true }} onSave={toggleSaved} busy={busyJobId === job.id}/>)}</div> : <EmptyState title="No saved jobs">Save a job from the opportunities page and it will be listed here.</EmptyState>}</>

  if (section === 'Find Opportunities') return <><div className="dashboard-heading"><div><span className="eyebrow">Real roles from employers</span><h1>Find Opportunities</h1><p>Explore current job listings and apply using your candidate account.</p></div></div>
    {error && <p className="candidate-error" role="alert">{error}</p>}{notice && <p className="candidate-success" role="status">{notice}</p>}
    {dashboard?.recommendations.length ? <div className="candidate-job-list">{dashboard.recommendations.map(job => <CandidateJobCard key={job.id} job={job} onSave={toggleSaved} onApply={apply} busy={busyJobId === job.id} showMissingSkills/>)}</div> : <EmptyState title="No eligible live opportunities">Active eligible job postings will appear here when employers publish them.</EmptyState>}</>

  return <><div className="dashboard-heading"><div><span className="eyebrow">Candidate workspace</span><h1>Welcome, {dashboard?.candidate.fullName || 'Candidate'}</h1><p>{dashboard?.candidate.location ? `${dashboard.candidate.location} · ` : ''}Your job-search overview, based on your saved profile and current opportunities.</p></div><Link href="/candidate/profile" className="button primary">Update profile <ArrowRight size={15}/></Link></div>
    {error && <p className="candidate-error" role="alert">{error}</p>}{notice && <p className="candidate-success" role="status">{notice}</p>}
    {dashboard && <>
      <div className="candidate-stat-grid">
        {[['Eligible opportunities', dashboard.stats.eligibleOpportunities], ['Strong skill matches', dashboard.stats.strongMatches], ['Applications submitted', dashboard.stats.applicationsSubmitted], ['Skills to improve', dashboard.stats.skillsToImprove]].map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}
      </div>
      <section className="candidate-completion-banner"><div><span className="eyebrow">Profile completeness</span><h2>{dashboard.profileCompletion}% complete</h2><p>A more complete profile helps clarify your background and job preferences.</p></div><div className="candidate-completion-track" role="progressbar" aria-valuenow={dashboard.profileCompletion} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${dashboard.profileCompletion}%` }}/></div><Link className="button secondary" href="/candidate/profile">Complete profile</Link></section>
      <div className="candidate-dashboard-columns">
        <section className="panel candidate-dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">Skill relevance and eligibility</span><h2>Recommended opportunities</h2></div><Link href="/candidate/opportunities">View all <ArrowRight size={14}/></Link></div>
          {dashboard.recommendations.length ? <div className="candidate-job-list">{dashboard.recommendations.slice(0, 5).map(job => <CandidateJobCard key={job.id} job={job} onSave={toggleSaved} onApply={apply} busy={busyJobId === job.id} showMissingSkills/>)}</div> : <EmptyState title="No eligible recommendations">Update your experience and skills in your profile, or check again as new roles are posted.</EmptyState>}
        </section>
        <aside className="panel candidate-dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">Your profile</span><h2>Saved jobs</h2></div><Link href="/candidate/saved-jobs">View all <ArrowRight size={14}/></Link></div>
          {dashboard.savedJobs.length ? <div className="candidate-saved-list">{dashboard.savedJobs.slice(0, 5).map(job => <div key={job.id}><span className="candidate-saved-icon"><Heart size={15}/></span><div><b>{job.title}</b><small>{job.employer.name} · {job.location}</small></div></div>)}</div> : <p className="candidate-empty-inline">Jobs you save will be available here.</p>}
          <div className="candidate-panel-divider"/><div className="panel-heading"><h2>Recent applications</h2><Link href="/candidate/applications">View all <ArrowRight size={14}/></Link></div>
          {dashboard.applications.length ? <div className="candidate-saved-list">{dashboard.applications.slice(0, 4).map(application => <div key={application.id}><span className="candidate-application-dot"/><div><b>{application.job?.title || 'Job posting unavailable'}</b><small>{application.status} · {dateLabel(application.createdAt)}</small></div></div>)}</div> : <p className="candidate-empty-inline">Your submitted applications will show up here.</p>}
        </aside>
      </div>
      {dashboard.skillGaps.length > 0 && <section className="candidate-gap-panel"><div><span className="eyebrow">Potential areas to develop</span><h2>Skills requested by eligible roles</h2><p>These skills appear on eligible active job listings and are not in your profile yet.</p></div><div className="candidate-job-skills">{dashboard.skillGaps.slice(0, 12).map(skill => <span key={skill}>{skill}</span>)}</div><Link href="/candidate/profile" className="button secondary small">Update my skills</Link></section>}
    </>}
  </>
}
