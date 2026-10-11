const Progress = require('../models/Progress')
const Resource = require('../models/Resource')

const COMPLETION_THRESHOLD_PERCENT = 90

async function recordProgress(req, res, next) {
  try {
    const { resourceId } = req.params
    const userId = req.user._id
    const lessonId = req.body.lessonId || 'main'

    const resource = await Resource.findById(resourceId)
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' })
    }

    const rawPosition = Number(req.body.playbackPositionSeconds)
    const playbackPositionSeconds = Number.isFinite(rawPosition) && rawPosition >= 0 ? Math.round(rawPosition) : 0

    const rawDuration = Number(req.body.totalDurationSeconds)
    const resourceDuration = resource.durationSeconds || (resource.durationMinutes ? resource.durationMinutes * 60 : 0)
    const totalDurationSeconds = Number.isFinite(rawDuration) && rawDuration > 0 ? Math.round(rawDuration) : resourceDuration

    // Calculate percentage clamped 0 to 100
    let completionPercentage = 0
    if (totalDurationSeconds > 0) {
      completionPercentage = Math.min(100, Math.max(0, Math.round((playbackPositionSeconds / totalDurationSeconds) * 100)))
    }

    const forceComplete = Boolean(req.body.markComplete)
    const meetsCompletionCriteria = forceComplete || completionPercentage >= COMPLETION_THRESHOLD_PERCENT

    let progress = await Progress.findOne({ userId, resourceId, lessonId })

    if (!progress) {
      // First time learner is accessing this resource
      progress = new Progress({
        userId,
        resourceId,
        lessonId,
        playbackPositionSeconds,
        totalDurationSeconds,
        completionPercentage,
        status: meetsCompletionCriteria ? 'completed' : 'in_progress',
        lastActivityAt: new Date(),
        completedAt: meetsCompletionCriteria ? new Date() : null,
      })
    } else {
      // Updating existing progress record
      progress.playbackPositionSeconds = playbackPositionSeconds
      if (totalDurationSeconds > 0) {
        progress.totalDurationSeconds = totalDurationSeconds
      }

      // If already completed in the past, preserve completed status even on rewind/replay
      if (progress.status === 'completed') {
        progress.completionPercentage = Math.max(progress.completionPercentage, completionPercentage)
      } else {
        progress.completionPercentage = completionPercentage
        if (meetsCompletionCriteria) {
          progress.status = 'completed'
          progress.completedAt = new Date()
        }
      }

      progress.lastActivityAt = new Date()
    }

    await progress.save()

    return res.json({
      progress: {
        id: progress._id.toString(),
        resourceId: progress.resourceId.toString(),
        lessonId: progress.lessonId,
        playbackPositionSeconds: progress.playbackPositionSeconds,
        totalDurationSeconds: progress.totalDurationSeconds,
        completionPercentage: progress.completionPercentage,
        status: progress.status,
        lastActivityAt: progress.lastActivityAt,
        completedAt: progress.completedAt,
      },
    })
  } catch (error) {
    return next(error)
  }
}

async function getProgressForResource(req, res, next) {
  try {
    const { resourceId } = req.params
    const userId = req.user._id

    const progress = await Progress.findOne({ userId, resourceId, lessonId: 'main' }).lean()

    if (!progress) {
      return res.json({ progress: null })
    }

    return res.json({
      progress: {
        id: progress._id.toString(),
        resourceId: progress.resourceId.toString(),
        lessonId: progress.lessonId,
        playbackPositionSeconds: progress.playbackPositionSeconds,
        totalDurationSeconds: progress.totalDurationSeconds,
        completionPercentage: progress.completionPercentage,
        status: progress.status,
        lastActivityAt: progress.lastActivityAt,
        completedAt: progress.completedAt,
      },
    })
  } catch (error) {
    return next(error)
  }
}

async function getMyLearningProgress(req, res, next) {
  try {
    const userId = req.user._id

    const progressList = await Progress.find({ userId })
      .sort({ lastActivityAt: -1 })
      .populate({
        path: 'resourceId',
        populate: { path: 'providerId', select: 'fullName profile' },
      })
      .lean()

    const inProgress = []
    const completed = []
    const allSkillsSet = new Set()
    let totalSecondsTracked = 0

    for (const item of progressList) {
      if (!item.resourceId) continue // Resource was deleted

      const resource = item.resourceId
      const providerName = resource.providerId?.profile?.organizationName || resource.providerId?.fullName || 'Training Provider'

      const entry = {
        id: item._id.toString(),
        progressId: item._id.toString(),
        resourceId: resource._id.toString(),
        title: resource.title,
        description: resource.description,
        resourceType: resource.resourceType,
        contentUrl: resource.contentUrl,
        thumbnailUrl: resource.thumbnailUrl || '',
        skills: resource.skills || [],
        targetRoles: resource.targetRoles || [],
        category: resource.category,
        difficulty: resource.difficulty,
        language: resource.language,
        durationMinutes: resource.durationMinutes,
        provider: {
          name: providerName,
        },
        playbackPositionSeconds: item.playbackPositionSeconds,
        totalDurationSeconds: item.totalDurationSeconds || resource.durationSeconds || (resource.durationMinutes ? resource.durationMinutes * 60 : 0),
        completionPercentage: item.completionPercentage,
        status: item.status,
        lastActivityAt: item.lastActivityAt,
        completedAt: item.completedAt,
      }

      totalSecondsTracked += item.playbackPositionSeconds || 0
      for (const skill of resource.skills || []) {
        allSkillsSet.add(skill)
      }

      if (item.status === 'completed') {
        completed.push(entry)
      } else {
        inProgress.push(entry)
      }
    }

    return res.json({
      inProgress,
      completed,
      stats: {
        startedCount: progressList.length,
        completedCount: completed.length,
        inProgressCount: inProgress.length,
        totalMinutesLearned: Math.round(totalSecondsTracked / 60),
        skillsDevelopedCount: allSkillsSet.size,
        skillsDeveloped: Array.from(allSkillsSet),
      },
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  recordProgress,
  getProgressForResource,
  getMyLearningProgress,
}
