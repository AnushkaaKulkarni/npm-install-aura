export type ApiResponse<T> = T & { error?: string }

export type ResourceType = 'video' | 'course' | 'document' | 'exercise' | 'external'
export interface ExternalLearningResult {
  id: string
  title: string
  url: string
  description: string
  source: string
  resultType: string
  thumbnail?: string
  channel?: string
}
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type PublicationStatus = 'draft' | 'under_review' | 'published' | 'archived'

export interface Lesson {
  id: string
  title: string
  durationMinutes: number
  durationSeconds: number
  contentUrl: string
  resourceType: ResourceType
  order: number
}

export interface UserProgress {
  playbackPositionSeconds: number
  totalDurationSeconds: number
  completionPercentage: number
  status: 'in_progress' | 'completed'
  lastActivityAt: string
  completedAt?: string
}

export interface LearningResource {
  id: string
  title: string
  description: string
  resourceType: ResourceType
  contentUrl: string
  thumbnailUrl: string
  skills: string[]
  targetRoles: string[]
  category: string
  difficulty: DifficultyLevel
  language: string
  durationMinutes: number
  durationSeconds: number
  prerequisites: string[]
  learningObjectives: string[]
  lessons: Lesson[]
  status: PublicationStatus
  viewsCount: number
  createdAt: string
  updatedAt: string
  provider: {
    id: string
    name: string
    website?: string
  }
  userProgress?: UserProgress | null
  activity?: {
    views: number
    uniqueLearners: number
    totalStarts: number
    completions: number
    completionRate: number
  }
  recommendationScore?: number
  recommendationReason?: string
  matchingSkills?: string[]
}

export interface ProviderStats {
  totalResources: number
  publishedResources: number
  draftResources: number
  underReviewResources: number
  archivedResources: number
  totalViews: number
  uniqueLearners: number
  totalStarts: number
  totalCompletions: number
  completionRate: number
}

export interface SkillItem {
  _id: string
  canonicalId: string
  name: string
  category: string
  aliases: string[]
  targetRoles: string[]
  status: string
}

export interface ProgressItem {
  id: string
  progressId: string
  resourceId: string
  title: string
  description: string
  resourceType: ResourceType
  contentUrl: string
  thumbnailUrl: string
  skills: string[]
  targetRoles: string[]
  category: string
  difficulty: DifficultyLevel
  language: string
  durationMinutes: number
  durationSeconds?: number
  provider: {
    name: string
  }
  playbackPositionSeconds: number
  totalDurationSeconds: number
  completionPercentage: number
  status: 'in_progress' | 'completed'
  lastActivityAt?: string
  completedAt?: string
}

export interface LearnerProgressSummary {
  inProgress: ProgressItem[]
  completed: ProgressItem[]
  stats: {
    startedCount: number
    completedCount: number
    inProgressCount: number
    totalMinutesLearned: number
    skillsDevelopedCount: number
    skillsDeveloped: string[]
  }
}

export function apiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
  if (!base) throw new Error('The API is not configured. Set NEXT_PUBLIC_API_URL and try again.')
  return base
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...options,
      credentials: 'include',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    })
  } catch {
    throw new Error('Unable to reach the API. Check that the backend is running and try again.')
  }
  let result: ApiResponse<T>
  try {
    result = await response.json()
  } catch {
    throw new Error('The API returned an invalid response.')
  }
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.')
  return result
}
