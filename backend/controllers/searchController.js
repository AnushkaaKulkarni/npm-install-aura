const SERPAPI_KEY = process.env.SERPAPI_API_KEY
const crypto = require('node:crypto')

// In-memory cache: key -> { data, timestamp }
const searchCache = new Map()
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes
const MAX_RESULTS = 20
const REQUEST_TIMEOUT_MS = 10000

// Pending requests to avoid duplicate concurrent fetches
const pendingRequests = new Map()

function normalizeCacheKey(query, source, language) {
  return `${(query || '').toLowerCase().trim()}|${source || 'all'}|${language || 'en'}`
}

function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, entry] of searchCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      searchCache.delete(key)
    }
  }
}

// Parse SerpApi organic results into normalized objects
function normalizeGoogleResults(data) {
  const results = []

  // Organic results
  if (Array.isArray(data.organic_results)) {
    for (const item of data.organic_results.slice(0, MAX_RESULTS)) {
      if (!item.link) continue

      const domain = extractDomain(item.link)
      const resultType = classifySource(domain, item.link)

      results.push({
        id: crypto.createHash('sha256').update(item.link).digest('hex').slice(0, 24),
        title: item.title || 'Untitled',
        url: item.link,
        description: item.snippet || '',
        source: domain,
        resultType,
        thumbnail: item.thumbnail || '',
        position: item.position || 0,
      })
    }
  }

  return results
}

// Parse SerpApi YouTube results into normalized objects
function normalizeYouTubeResults(data) {
  const results = []

  if (Array.isArray(data.video_results)) {
    for (const item of data.video_results.slice(0, MAX_RESULTS)) {
      const link = item.link || ''
      if (!link) continue

      results.push({
        id: crypto.createHash('sha256').update(link).digest('hex').slice(0, 24),
        title: item.title || 'Untitled',
        url: link,
        description: item.description || '',
        source: 'youtube.com',
        resultType: 'Video tutorial',
        thumbnail: item.thumbnail?.static || item.thumbnail || '',
        duration: item.length || '',
        channel: item.channel?.name || '',
        views: item.views ? String(item.views) : '',
        position: item.position || 0,
      })
    }
  }

  return results
}

function extractDomain(url) {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function classifySource(domain, url) {
  const educational = [
    'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org',
    'codecademy.com', 'freecodecamp.org', 'pluralsight.com',
    'linkedin.com', 'skillshare.com', 'udacity.com',
    'nptel.ac.in', 'swayam.gov.in', 'geeksforgeeks.org',
    'w3schools.com', 'tutorialspoint.com', 'javatpoint.com',
    'hackerrank.com', 'leetcode.com',
  ]
  const videoSites = ['youtube.com', 'youtu.be', 'vimeo.com']
  const docSites = ['docs.python.org', 'developer.mozilla.org', 'docs.microsoft.com', 'devdocs.io']

  if (videoSites.some(v => domain.includes(v))) return 'Video tutorial'
  if (educational.some(e => domain.includes(e))) return 'Online course'
  if (docSites.some(d => domain.includes(d))) return 'Documentation'
  if (domain.includes('github.com')) return 'Repository'
  if (domain.includes('medium.com') || domain.includes('dev.to')) return 'Article'
  return 'External resource'
}

async function fetchSerpApi(params) {
  const url = new URL('https://serpapi.com/search.json')
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const error = new Error('External search is temporarily unavailable.')
        error.status = 502
        throw error
      }
      if (response.status === 429) {
        const error = new Error('External search is rate limited. Please try again later.')
        error.status = 429
        throw error
      }
      const error = new Error('External search is temporarily unavailable.')
      error.status = 502
      throw error
    }

    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function externalSearch(req, res, next) {
  try {
    // Validate SerpApi key
    if (!SERPAPI_KEY || SERPAPI_KEY === 'your_serpapi_key_here') {
      return res.status(503).json({
        error: 'External search is not configured. The server administrator must set a valid SERPAPI_API_KEY.',
        results: [],
      })
    }

    const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.', results: [] })
    }
    if (query.length > 200) {
      return res.status(400).json({ error: 'Search query is too long (max 200 characters).', results: [] })
    }

    const source = typeof req.query.source === 'string' ? req.query.source.toLowerCase() : 'all'
    if (!['all', 'youtube', 'courses'].includes(source)) {
      return res.status(400).json({ error: 'Select a supported search source.', results: [] })
    }
    const language = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : 'en'
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)

    // Check cache
    cleanExpiredCache()
    const cacheKey = normalizeCacheKey(query, source, language) + `|p${page}`
    const cached = searchCache.get(cacheKey)
    if (cached) {
      return res.json({
        results: cached.data,
        query,
        source,
        language,
        page,
        cached: true,
      })
    }

    // Prevent duplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      try {
        const data = await pendingRequests.get(cacheKey)
        return res.json({ results: data, query, source, language, page, cached: true })
      } catch (err) {
        return res.status(502).json({ error: 'Search failed. Please try again.', results: [] })
      }
    }

    // Build SerpApi request
    let fetchPromise

    if (source === 'youtube') {
      fetchPromise = fetchSerpApi({
        engine: 'youtube',
        search_query: `${query} tutorial course`,
        api_key: SERPAPI_KEY,
        gl: 'in',
        hl: language === 'hi' ? 'hi' : 'en',
      }).then(data => normalizeYouTubeResults(data))
    } else {
      fetchPromise = fetchSerpApi({
        engine: 'google',
        q: source === 'courses'
          ? `${query} online course tutorial`
          : `${query} course tutorial learning`,
        api_key: SERPAPI_KEY,
        gl: 'in',
        hl: language === 'hi' ? 'hi' : 'en',
        num: MAX_RESULTS,
        start: (page - 1) * MAX_RESULTS,
      }).then(data => normalizeGoogleResults(data))
    }

    pendingRequests.set(cacheKey, fetchPromise)

    try {
      const rawResults = await fetchPromise
      const seen = new Set()
      const results = rawResults.filter((item) => {
        try {
          const parsed = new URL(item.url)
          if (!['http:', 'https:'].includes(parsed.protocol) || seen.has(parsed.href)) return false
          seen.add(parsed.href)
          return true
        } catch {
          return false
        }
      }).slice(0, MAX_RESULTS)

      // Cache results
      searchCache.set(cacheKey, { data: results, timestamp: Date.now() })

      return res.json({
        results,
        query,
        source,
        language,
        page,
        cached: false,
      })
    } finally {
      pendingRequests.delete(cacheKey)
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'External search timed out. Please try again.', results: [] })
    }
    return res.status(error.status || 502).json({ error: error.status ? error.message : 'External search is temporarily unavailable.', results: [] })
  }
}

module.exports = {
  externalSearch,
}
