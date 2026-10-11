const bcrypt = require('bcryptjs')
const Resource = require('../models/Resource')
const Progress = require('../models/Progress')
const User = require('../models/User')

const validResourceTypes = ['video', 'course', 'document', 'exercise', 'external']
const validDifficulties = ['Beginner', 'Intermediate', 'Advanced']
const validStatuses = ['draft', 'under_review', 'published', 'archived']

async function ensureDefaultResources() {
  try {
    const resourceCount = await Resource.countDocuments()
    if (resourceCount > 0) return

    let providerUser = await User.findOne({ role: 'provider' })
    if (!providerUser) {
      providerUser = await User.create({
        fullName: 'EduSkills Academy',
        email: 'provider@eduskills.org',
        phone: '+91 98765 00000',
        passwordHash: await bcrypt.hash('Provider123!', 12),
        role: 'provider',
        verificationStatus: 'verified',
        profile: {
          organizationName: 'EduSkills Academy',
          designation: 'Curriculum Director',
          website: 'https://eduskills.org',
          industry: 'Education & Training',
          description: 'National skilling partner empowering Indian job seekers with industry-aligned technical curriculum.',
        },
      })
    }

    const initialMaterials = [
      {
        providerId: providerUser._id,
        provider: providerUser._id,
        title: 'Building REST APIs with Node.js & Express',
        description: 'Learn how to design, build, and test enterprise-ready REST APIs using Express.js and Node.js, covering routing, middleware, error handling, status codes, and database interaction.',
        resourceType: 'video',
        contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: '',
        skills: ['REST API Development', 'Node.js', 'Express.js'],
        targetRoles: ['Backend Developer', 'Software Developer (Fresher)', 'Full Stack Developer'],
        category: 'Web Development',
        difficulty: 'Intermediate',
        language: 'English',
        durationMinutes: 35,
        durationSeconds: 2100,
        prerequisites: ['JavaScript Basics', 'HTTP Fundamentals'],
        learningObjectives: ['Design clean RESTful resource endpoints', 'Implement custom middleware', 'Standardize JSON error handling'],
        status: 'published',
        viewsCount: 384,
      },
      {
        providerId: providerUser._id,
        provider: providerUser._id,
        title: 'SQL Query Optimization & Relational Databases',
        description: 'Master SQL fundamentals, indexes, joins, aggregations, query explain plans, and optimization patterns for production databases.',
        resourceType: 'course',
        contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: '',
        skills: ['SQL', 'Database Query Optimization'],
        targetRoles: ['Data Analyst', 'Backend Developer', 'Software Developer (Fresher)'],
        category: 'Databases',
        difficulty: 'Beginner',
        language: 'English',
        durationMinutes: 45,
        durationSeconds: 2700,
        prerequisites: ['Basic computer literacy'],
        learningObjectives: ['Write advanced JOIN queries', 'Build indexes for performance', 'Analyze execution plans'],
        lessons: [
          {
            title: 'Relational Database Fundamentals',
            durationMinutes: 15,
            durationSeconds: 900,
            contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            resourceType: 'video',
            order: 1,
          },
          {
            title: 'Complex Joins and Aggregations',
            durationMinutes: 15,
            durationSeconds: 900,
            contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            resourceType: 'video',
            order: 2,
          },
          {
            title: 'Query Indexing & Execution Plans',
            durationMinutes: 15,
            durationSeconds: 900,
            contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            resourceType: 'video',
            order: 3,
          },
        ],
        status: 'published',
        viewsCount: 512,
      },
      {
        providerId: providerUser._id,
        provider: providerUser._id,
        title: 'Testing Fundamentals & Quality Assurance for Developers',
        description: 'Comprehensive guide to software testing, test-driven development, unit testing with Jest, integration test practices, and CI verification.',
        resourceType: 'video',
        contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: '',
        skills: ['Testing Fundamentals', 'Git & GitHub'],
        targetRoles: ['Software Developer (Fresher)', 'Quality Assurance'],
        category: 'Quality Assurance',
        difficulty: 'Beginner',
        language: 'Hindi & English',
        durationMinutes: 25,
        durationSeconds: 1500,
        prerequisites: ['Basic programming logic'],
        learningObjectives: ['Write assertions and mock objects', 'Measure test coverage', 'Automate tests on commit'],
        status: 'published',
        viewsCount: 290,
      },
      {
        providerId: providerUser._id,
        provider: providerUser._id,
        title: 'Modern Python for Data Analysis & Visualization',
        description: 'Hands-on training in Python 3, Pandas data structures, data cleaning pipelines, and Matplotlib data visualization techniques.',
        resourceType: 'video',
        contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
        thumbnailUrl: '',
        skills: ['Python', 'Data Analysis'],
        targetRoles: ['Data Analyst', 'Software Developer (Fresher)'],
        category: 'Data Science & Analytics',
        difficulty: 'Beginner',
        language: 'English',
        durationMinutes: 40,
        durationSeconds: 2400,
        prerequisites: ['Basic arithmetic and logic'],
        learningObjectives: ['Clean messy tabular datasets', 'Perform grouping and pivot aggregations', 'Generate executive visual charts'],
        status: 'published',
        viewsCount: 640,
      },
      {
        providerId: providerUser._id,
        provider: providerUser._id,
        title: 'Microservices & Containerization with Docker',
        description: 'Draft curriculum on multi-stage Docker builds, container networking, environment secrets, and microservice orchestration.',
        resourceType: 'course',
        contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: '',
        skills: ['Docker', 'REST API Development'],
        targetRoles: ['Backend Developer', 'DevOps Engineer'],
        category: 'DevOps & Tools',
        difficulty: 'Advanced',
        language: 'English',
        durationMinutes: 60,
        durationSeconds: 3600,
        status: 'draft',
        viewsCount: 0,
      },
      {
        providerId: providerUser._id,
        provider: providerUser._id,
        title: 'Power BI Business Analytics & Interactive Dashboards',
        description: 'Curriculum undergoing state skilling accreditation for building executive Power BI dashboards, DAX formulas, and data models.',
        resourceType: 'video',
        contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        thumbnailUrl: '',
        skills: ['Power BI', 'Data Analysis', 'Excel'],
        targetRoles: ['Data Analyst'],
        category: 'Data Science & Analytics',
        difficulty: 'Intermediate',
        language: 'English',
        durationMinutes: 50,
        durationSeconds: 3000,
        status: 'under_review',
        viewsCount: 0,
      },
    ]

    await Resource.insertMany(initialMaterials)
  } catch {
    // Ignore parallel insertion conflicts
  }
}

function validateResourcePayload(body, isPublishing = false) {
  if (!body || typeof body !== 'object') return 'Resource details must be a JSON object.'

  if (typeof body.title !== 'string' || !body.title.trim()) {
    return 'Enter a valid resource title.'
  }
  if (body.title.trim().length > 200) {
    return 'Resource title cannot exceed 200 characters.'
  }

  if (typeof body.description !== 'string' || !body.description.trim()) {
    return 'Enter a valid description.'
  }

  if (!validResourceTypes.includes(body.resourceType)) {
    return 'Select a valid resource type.'
  }

  if (typeof body.contentUrl !== 'string' || !body.contentUrl.trim()) {
    return 'Enter a valid content file or resource URL.'
  }

  if (!Array.isArray(body.skills) || body.skills.filter(s => typeof s === 'string' && s.trim()).length === 0) {
    return 'Select at least one skill taught by this resource.'
  }

  if (typeof body.category !== 'string' || !body.category.trim()) {
    return 'Select a category for this resource.'
  }

  if (body.difficulty && !validDifficulties.includes(body.difficulty)) {
    return 'Select a valid difficulty level.'
  }

  if (isPublishing) {
    try {
      const parsed = new URL(body.contentUrl.trim())
      if (!['http:', 'https:'].includes(parsed.protocol)) return 'Learning URL must use HTTP or HTTPS.'
    } catch { return 'Enter a valid HTTP or HTTPS learning URL.' }
  }

  return null
}

function sanitizeStringArray(arr) {
  if (!Array.isArray(arr)) return []
  return arr
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function sanitizeLessons(lessons) {
  if (!Array.isArray(lessons)) return []
  return lessons.map((l, index) => ({
    title: typeof l.title === 'string' && l.title.trim() ? l.title.trim() : `Lesson ${index + 1}`,
    durationMinutes: Number(l.durationMinutes) > 0 ? Number(l.durationMinutes) : 10,
    durationSeconds: Number(l.durationSeconds) > 0 ? Number(l.durationSeconds) : (Number(l.durationMinutes) > 0 ? Number(l.durationMinutes) * 60 : 600),
    contentUrl: typeof l.contentUrl === 'string' ? l.contentUrl.trim() : '',
    resourceType: validResourceTypes.includes(l.resourceType) ? l.resourceType : 'video',
    order: index + 1,
  }))
}

// Format resource for client
function formatResource(resource, progress = null) {
  const providerName = resource.providerId?.profile?.organizationName || resource.providerId?.fullName || 'Training Provider'
  const durationMin = resource.durationMinutes || (resource.durationSeconds ? Math.ceil(resource.durationSeconds / 60) : 0)

  return {
    id: resource._id.toString(),
    title: resource.title,
    description: resource.description,
    resourceType: resource.resourceType,
    contentUrl: resource.contentUrl,
    thumbnailUrl: resource.thumbnailUrl || '',
    skills: resource.skills || [],
    targetRoles: resource.targetRoles || [],
    category: resource.category,
    difficulty: resource.difficulty || 'Beginner',
    language: resource.language || 'English',
    durationMinutes: durationMin,
    durationSeconds: resource.durationSeconds || (durationMin ? durationMin * 60 : 0),
    prerequisites: resource.prerequisites || [],
    learningObjectives: resource.learningObjectives || [],
    lessons: (resource.lessons || []).map(l => ({
      id: l._id ? l._id.toString() : l.title,
      title: l.title,
      durationMinutes: l.durationMinutes,
      durationSeconds: l.durationSeconds,
      contentUrl: l.contentUrl,
      resourceType: l.resourceType,
      order: l.order,
    })),
    status: resource.status,
    viewsCount: resource.viewsCount || 0,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    provider: {
      id: resource.providerId?._id ? resource.providerId._id.toString() : resource.providerId,
      name: providerName,
      website: resource.providerId?.profile?.website || '',
    },
    userProgress: progress ? {
      playbackPositionSeconds: progress.playbackPositionSeconds || 0,
      totalDurationSeconds: progress.totalDurationSeconds || 0,
      completionPercentage: progress.completionPercentage || 0,
      status: progress.status,
      lastActivityAt: progress.lastActivityAt,
      completedAt: progress.completedAt,
    } : null,
  }
}

// Provider: Create resource
async function createResource(req, res, next) {
  try {
    const isPublishing = req.body.status === 'published'
    const validationError = validateResourcePayload(req.body, isPublishing)
    if (validationError) return res.status(400).json({ error: validationError })

    const durationMinutes = Number(req.body.durationMinutes) > 0 ? Number(req.body.durationMinutes) : 0
    const durationSeconds = Number(req.body.durationSeconds) > 0 ? Number(req.body.durationSeconds) : durationMinutes * 60

    const status = validStatuses.includes(req.body.status) ? req.body.status : 'draft'

    const resource = await Resource.create({
      providerId: req.user._id,
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      resourceType: req.body.resourceType,
      contentUrl: req.body.contentUrl.trim(),
      thumbnailUrl: typeof req.body.thumbnailUrl === 'string' ? req.body.thumbnailUrl.trim() : '',
      skills: sanitizeStringArray(req.body.skills),
      targetRoles: sanitizeStringArray(req.body.targetRoles),
      category: req.body.category.trim(),
      difficulty: req.body.difficulty || 'Beginner',
      language: typeof req.body.language === 'string' && req.body.language.trim() ? req.body.language.trim() : 'English',
      durationMinutes,
      durationSeconds,
      prerequisites: sanitizeStringArray(req.body.prerequisites),
      learningObjectives: sanitizeStringArray(req.body.learningObjectives),
      lessons: sanitizeLessons(req.body.lessons),
      status,
    })

    return res.status(201).json({ resource: formatResource(resource) })
  } catch (error) {
    return next(error)
  }
}

// Provider: List their materials with aggregated progress metrics
async function listProviderResources(req, res, next) {
  try {
    const filter = { providerId: req.user._id }

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status
    }
    if (req.query.resourceType && req.query.resourceType !== 'all') {
      filter.resourceType = req.query.resourceType
    }
    if (req.query.skill) {
      filter.skills = req.query.skill
    }
    if (req.query.targetRole) {
      filter.targetRoles = req.query.targetRole
    }
    if (req.query.search) {
      const q = req.query.search.trim()
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { skills: new RegExp(q, 'i') },
      ]
    }

    const resources = await Resource.find(filter)
      .sort({ updatedAt: -1 })
      .populate('providerId', 'fullName profile')
      .lean()

    const resourceIds = resources.map(r => r._id)

    // Aggregate progress stats per resource
    const progressStats = await Progress.aggregate([
      { $match: { resourceId: { $in: resourceIds } } },
      {
        $group: {
          _id: '$resourceId',
          uniqueLearners: { $addToSet: '$userId' },
          totalStarts: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 1,
          uniqueLearnersCount: { $size: '$uniqueLearners' },
          totalStarts: 1,
          completions: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalStarts', 0] },
              { $round: [{ $multiply: [{ $divide: ['$completions', '$totalStarts'] }, 100] }] },
              0,
            ],
          },
        },
      },
    ])

    const statsMap = new Map()
    for (const stat of progressStats) {
      statsMap.set(stat._id.toString(), stat)
    }

    const items = resources.map(r => {
      const stats = statsMap.get(r._id.toString()) || {
        uniqueLearnersCount: 0,
        totalStarts: 0,
        completions: 0,
        completionRate: 0,
      }
      return {
        ...formatResource(r),
        activity: {
          views: r.viewsCount || 0,
          uniqueLearners: stats.uniqueLearnersCount,
          totalStarts: stats.totalStarts,
          completions: stats.completions,
          completionRate: stats.completionRate,
        },
      }
    })

    return res.json({ resources: items })
  } catch (error) {
    return next(error)
  }
}

// Provider: Overall stats for dashboard KPIs and Analytics
async function getProviderStats(req, res, next) {
  try {
    const providerId = req.user._id

    const resources = await Resource.find({ providerId }).lean()
    const totalResources = resources.length
    const publishedResources = resources.filter(r => r.status === 'published').length
    const draftResources = resources.filter(r => r.status === 'draft').length
    const underReviewResources = resources.filter(r => r.status === 'under_review').length
    const archivedResources = resources.filter(r => r.status === 'archived').length

    const totalViews = resources.reduce((acc, r) => acc + (r.viewsCount || 0), 0)

    const resourceIds = resources.map(r => r._id)

    const progressSummary = await Progress.aggregate([
      { $match: { resourceId: { $in: resourceIds } } },
      {
        $group: {
          _id: null,
          allLearners: { $addToSet: '$userId' },
          totalStarts: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
    ])

    const stats = progressSummary[0] || { allLearners: [], totalStarts: 0, completions: 0 }
    const uniqueLearners = (stats.allLearners || []).length
    const totalStarts = stats.totalStarts || 0
    const totalCompletions = stats.completions || 0
    const completionRate = totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0

    return res.json({
      stats: {
        totalResources,
        publishedResources,
        draftResources,
        underReviewResources,
        archivedResources,
        totalViews,
        uniqueLearners,
        totalStarts,
        totalCompletions,
        completionRate,
      },
    })
  } catch (error) {
    return next(error)
  }
}

// Provider: Get single resource by ID for edit/preview
async function getProviderResource(req, res, next) {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      providerId: req.user._id,
    }).populate('providerId', 'fullName profile')

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or unauthorized.' })
    }

    // Get activity metrics
    const stats = await Progress.aggregate([
      { $match: { resourceId: resource._id } },
      {
        $group: {
          _id: null,
          uniqueLearners: { $addToSet: '$userId' },
          starts: { $sum: 1 },
          completions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ])

    const st = stats[0] || { uniqueLearners: [], starts: 0, completions: 0 }
    const uniqueLearners = (st.uniqueLearners || []).length
    const totalStarts = st.starts || 0
    const totalCompletions = st.completions || 0
    const completionRate = totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0

    return res.json({
      resource: {
        ...formatResource(resource),
        activity: {
          views: resource.viewsCount || 0,
          uniqueLearners,
          totalStarts,
          totalCompletions,
          completionRate,
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}

// Provider: Update resource
async function updateResource(req, res, next) {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      providerId: req.user._id,
    })

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or unauthorized.' })
    }

    const isPublishing = req.body.status === 'published'
    const validationError = validateResourcePayload({ ...resource.toObject(), ...req.body }, isPublishing)
    if (validationError) return res.status(400).json({ error: validationError })

    if (req.body.title !== undefined) resource.title = req.body.title.trim()
    if (req.body.description !== undefined) resource.description = req.body.description.trim()
    if (req.body.resourceType !== undefined) resource.resourceType = req.body.resourceType
    if (req.body.contentUrl !== undefined) resource.contentUrl = req.body.contentUrl.trim()
    if (req.body.thumbnailUrl !== undefined) resource.thumbnailUrl = req.body.thumbnailUrl.trim()
    if (req.body.skills !== undefined) resource.skills = sanitizeStringArray(req.body.skills)
    if (req.body.targetRoles !== undefined) resource.targetRoles = sanitizeStringArray(req.body.targetRoles)
    if (req.body.category !== undefined) resource.category = req.body.category.trim()
    if (req.body.difficulty !== undefined) resource.difficulty = req.body.difficulty
    if (req.body.language !== undefined) resource.language = req.body.language.trim()
    if (req.body.durationMinutes !== undefined) {
      const min = Number(req.body.durationMinutes) > 0 ? Number(req.body.durationMinutes) : 30
      resource.durationMinutes = min
      resource.durationSeconds = min * 60
    }
    if (req.body.prerequisites !== undefined) resource.prerequisites = sanitizeStringArray(req.body.prerequisites)
    if (req.body.learningObjectives !== undefined) resource.learningObjectives = sanitizeStringArray(req.body.learningObjectives)
    if (req.body.lessons !== undefined) resource.lessons = sanitizeLessons(req.body.lessons)
    if (req.body.status !== undefined && validStatuses.includes(req.body.status)) {
      resource.status = req.body.status
    }

    await resource.save()

    return res.json({ resource: formatResource(resource) })
  } catch (error) {
    return next(error)
  }
}

// Provider: Delete or archive resource
async function deleteResource(req, res, next) {
  try {
    const resource = await Resource.findOneAndDelete({
      _id: req.params.id,
      providerId: req.user._id,
    })

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or unauthorized.' })
    }

    // Also remove associated progress records
    await Progress.deleteMany({ resourceId: resource._id })

    return res.json({ message: 'Resource removed successfully.' })
  } catch (error) {
    return next(error)
  }
}

// Provider: Duplicate resource
async function duplicateResource(req, res, next) {
  try {
    const original = await Resource.findOne({
      _id: req.params.id,
      providerId: req.user._id,
    }).lean()

    if (!original) {
      return res.status(404).json({ error: 'Resource not found or unauthorized.' })
    }

    delete original._id
    delete original.createdAt
    delete original.updatedAt
    original.title = `${original.title} (Copy)`
    original.status = 'draft'
    original.viewsCount = 0

    const duplicated = await Resource.create(original)

    return res.status(201).json({ resource: formatResource(duplicated) })
  } catch (error) {
    return next(error)
  }
}

// Public/Learner: List published learning resources
async function listPublishedResources(req, res, next) {
  try {
    const filter = { status: 'published' }

    if (req.query.resourceType && req.query.resourceType !== 'all') {
      filter.resourceType = req.query.resourceType
    }
    if (req.query.difficulty && req.query.difficulty !== 'all') {
      filter.difficulty = req.query.difficulty
    }
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category
    }
    if (req.query.language && req.query.language !== 'all') {
      filter.language = new RegExp(`^${req.query.language}`, 'i')
    }
    if (req.query.skill) {
      filter.skills = req.query.skill
    }
    if (req.query.targetRole) {
      filter.targetRoles = req.query.targetRole
    }
    if (req.query.search) {
      const q = req.query.search.trim()
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { skills: new RegExp(q, 'i') },
        { targetRoles: new RegExp(q, 'i') },
      ]
    }

    const sortOption = {}
    if (req.query.sort === 'views') {
      sortOption.viewsCount = -1
    } else if (req.query.sort === 'duration') {
      sortOption.durationMinutes = 1
    } else {
      sortOption.createdAt = -1
    }

    const resources = await Resource.find(filter)
      .sort(sortOption)
      .populate('providerId', 'fullName profile')
      .lean()

    // If authenticated user is present, attach progress
    let progressMap = new Map()
    if (req.user) {
      const progresses = await Progress.find({
        userId: req.user._id,
        resourceId: { $in: resources.map(r => r._id) },
      }).lean()

      for (const p of progresses) {
        progressMap.set(p.resourceId.toString(), p)
      }
    }

    const items = resources.map(r => formatResource(r, progressMap.get(r._id.toString())))

    return res.json({ resources: items })
  } catch (error) {
    return next(error)
  }
}

// Public/Learner: Get single published resource
async function getPublishedResource(req, res, next) {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('providerId', 'fullName profile')

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' })
    }

    // Allow author provider to view even if draft
    const isOwner = req.user && resource.providerId._id.toString() === req.user._id.toString()
    if (resource.status !== 'published' && !isOwner) {
      return res.status(404).json({ error: 'This resource is not currently available.' })
    }

    // Increment view counter if public learner
    if (!isOwner) {
      resource.viewsCount = (resource.viewsCount || 0) + 1
      await resource.save()
    }

    // Fetch user progress if user logged in
    let progress = null
    if (req.user) {
      progress = await Progress.findOne({
        userId: req.user._id,
        resourceId: resource._id,
      }).lean()
    }

    return res.json({ resource: formatResource(resource, progress) })
  } catch (error) {
    return next(error)
  }
}

// Candidate: Skill-gap linked learning recommendations
async function getLearningRecommendations(req, res, next) {
  try {
    const targetRole = req.query.targetRole || 'Software Developer (Fresher)'
    let missingSkills = []

    if (req.query.missingSkills) {
      missingSkills = req.query.missingSkills.split(',').map(s => s.trim()).filter(Boolean)
    }

    // Standard skill expectations per role if not passed directly
    if (missingSkills.length === 0) {
      if (targetRole.includes('Software Developer')) {
        missingSkills = ['REST API Development', 'Testing Fundamentals', 'SQL']
      } else if (targetRole.includes('Backend Developer')) {
        missingSkills = ['REST API Development', 'Express.js', 'Database Query Optimization']
      } else if (targetRole.includes('Data Analyst')) {
        missingSkills = ['Power BI', 'SQL', 'Data Analysis']
      } else {
        missingSkills = ['Python', 'SQL', 'Git & GitHub']
      }
    }

    // Find published resources matching target role or missing skills
    const resources = await Resource.find({
      status: 'published',
      $or: [
        { skills: { $in: missingSkills } },
        { targetRoles: targetRole },
      ],
    })
      .populate('providerId', 'fullName profile')
      .lean()

    // Fetch user progress
    let progressMap = new Map()
    if (req.user) {
      const progresses = await Progress.find({
        userId: req.user._id,
        resourceId: { $in: resources.map(r => r._id) },
      }).lean()

      for (const p of progresses) {
        progressMap.set(p.resourceId.toString(), p)
      }
    }

    // Rank and attach recommendation reason
    const scored = resources.map(r => {
      const matchingSkills = (r.skills || []).filter(skill =>
        missingSkills.some(ms => ms.toLowerCase() === skill.toLowerCase())
      )
      const matchesRole = (r.targetRoles || []).includes(targetRole)

      let score = matchingSkills.length * 10 + (matchesRole ? 5 : 0)

      let reason = ''
      if (matchingSkills.length > 0) {
        reason = `Addresses missing skill${matchingSkills.length > 1 ? 's' : ''}: ${matchingSkills.join(', ')} for ${targetRole}`
      } else if (matchesRole) {
        reason = `Recommended curriculum for target role: ${targetRole}`
      } else {
        reason = `Relevant to your career pathway`
      }

      return {
        ...formatResource(r, progressMap.get(r._id.toString())),
        recommendationScore: score,
        recommendationReason: reason,
        matchingSkills,
      }
    })

    scored.sort((a, b) => b.recommendationScore - a.recommendationScore)

    return res.json({
      targetRole,
      missingSkills,
      recommendations: scored,
    })
  } catch (error) {
    return next(error)
  }
}

// Provider: Upload document file (PDF, DOCX, etc.)
async function uploadDocument(req, res, next) {
  try {
    const fs = require('fs')
    const path = require('path')

    const { filename, fileData, contentType } = req.body
    if (!filename || !fileData) {
      return res.status(400).json({ error: 'Filename and fileData are required.' })
    }

    const ext = path.extname(filename).toLowerCase()
    const allowed = ['.pdf', '.docx', '.doc', '.txt']
    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: 'Only PDF, DOCX, DOC and TXT document files are supported.' })
    }

    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 15MB limit.' })
    }

    const uploadDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(uploadDir, safeName)
    fs.writeFileSync(filePath, buffer)

    return res.json({
      fileUrl: `/uploads/${safeName}`,
      filename: safeName,
      originalName: filename,
      sizeBytes: buffer.length,
      mimeType: contentType || 'application/pdf',
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createResource,
  listProviderResources,
  getProviderStats,
  getProviderResource,
  updateResource,
  deleteResource,
  duplicateResource,
  listPublishedResources,
  getPublishedResource,
  getLearningRecommendations,
  uploadDocument,
}
