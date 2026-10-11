function normalizeSkill(value) {
  const normalized = value.trim().toLowerCase().replace(/[._-]/g, ' ').replace(/\s+/g, ' ')
  const aliases = { js: 'javascript', 'node js': 'nodejs', ts: 'typescript', 'c sharp': 'c#', 'dot net': '.net' }
  return aliases[normalized] || normalized
}

function isFresher(profile) {
  const status = typeof profile.employmentStatus === 'string' ? profile.employmentStatus.trim().toLowerCase() : ''
  return status === 'fresher' || status === 'student' || status === 'student / fresher'
}

function candidateExperience(profile) {
  if (typeof profile.experienceYears === 'number') return profile.experienceYears
  if (isFresher(profile)) return 0
  return null
}

function experienceEligibility(job, experienceYears) {
  const hasRange = job.minExperienceYears != null || job.maxExperienceYears != null
  if (!hasRange) return 'eligible'
  if (experienceYears === null) return 'unknown'
  if (job.minExperienceYears != null && experienceYears < job.minExperienceYears) return 'ineligible'
  if (job.maxExperienceYears != null && experienceYears > job.maxExperienceYears) return 'ineligible'
  return 'eligible'
}

function addSkill(skills, value, source) {
  if (typeof value !== 'string' || !value.trim()) return
  const normalized = normalizeSkill(value)
  const current = skills.get(normalized)
  if (current) {
    current.sources.add(source)
    if (!current.names.includes(value.trim())) current.names.push(value.trim())
    return
  }
  skills.set(normalized, { name: value.trim(), names: [value.trim()], sources: new Set([source]) })
}

function collectProfileSkills(profile) {
  const skills = new Map()
  for (const skill of profile.skills || []) {
    if (skill?.name) addSkill(skills, skill.name, 'profile skills')
  }
  for (const project of profile.projects || []) {
    for (const skill of project?.technologies || []) addSkill(skills, skill, 'project technologies')
  }
  for (const experience of profile.experience || []) {
    for (const skill of experience?.skills || []) addSkill(skills, skill, 'work experience')
  }
  return skills
}

function titleKey(title) {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

function matchesTargetRole(jobTitle, targetTitles) {
  if (!targetTitles.length) return true
  const role = titleKey(jobTitle)
  return targetTitles.some(target => {
    const normalizedTarget = titleKey(target)
    return role === normalizedTarget || role.includes(normalizedTarget) || normalizedTarget.includes(role)
  })
}

function priorityFor(demand, totalOpenings) {
  const share = totalOpenings ? demand / totalOpenings : 0
  if (demand >= 3 || (demand >= 2 && share >= 0.5)) return 'High'
  if (demand >= 2 || share >= 0.25) return 'Medium'
  return 'Focused'
}

function buildCandidateSkillAnalysis(profile, jobs, { preview = false } = {}) {
  const profileSkills = collectProfileSkills(profile)
  const targetTitles = (profile.desiredJobTitles || []).filter(title => typeof title === 'string' && title.trim())
  const targetJobs = jobs.filter(job => matchesTargetRole(job.title, targetTitles))
  const candidateYears = candidateExperience(profile)
  const roleMap = new Map()

  for (const job of targetJobs) {
    const key = titleKey(job.title)
    if (!roleMap.has(key)) roleMap.set(key, { title: job.title.trim(), jobs: [] })
    roleMap.get(key).jobs.push(job)
  }

  const roleSummaries = [...roleMap.values()].map(role => {
    const required = new Map()
    const eligibilityCounts = { eligible: 0, ineligible: 0, unknown: 0 }
    for (const job of role.jobs) {
      const status = experienceEligibility(job, candidateYears)
      eligibilityCounts[status] += 1
      const jobSkills = new Map()
      for (const skill of (job.requiredSkills || []).filter(value => typeof value === 'string' && value.trim())) {
        jobSkills.set(normalizeSkill(skill), skill.trim())
      }
      for (const [skillKey, displayName] of jobSkills) {
        const item = required.get(skillKey) || { openings: 0, name: displayName }
        item.openings += 1
        required.set(skillKey, item)
      }
    }

    const requiredSkills = [...required.values()].map(skill => ({
      name: skill.name,
      openings: skill.openings,
      covered: profileSkills.has(normalizeSkill(skill.name)),
    }))
    const coveredCount = requiredSkills.filter(skill => skill.covered).length
    const matchScore = requiredSkills.length ? Math.round(coveredCount / requiredSkills.length * 100) : null
    return {
      title: role.title,
      openings: role.jobs.length,
      eligibleOpenings: eligibilityCounts.eligible,
      ineligibleOpenings: eligibilityCounts.ineligible,
      unknownEligibilityOpenings: eligibilityCounts.unknown,
      experienceYears: candidateYears,
      requiredSkillCount: requiredSkills.length,
      coveredSkillCount: coveredCount,
      coveredSkills: requiredSkills.filter(skill => skill.covered).map(skill => skill.name).sort(),
      currentMatchScore: matchScore,
      missingSkills: requiredSkills.filter(skill => !skill.covered).sort((left, right) => right.openings - left.openings || left.name.localeCompare(right.name)),
    }
  }).sort((left, right) => right.openings - left.openings || left.title.localeCompare(right.title))

  const allOpenings = targetJobs.length
  const demandBySkill = new Map()
  for (const role of roleSummaries) {
    for (const skill of role.missingSkills) {
      const key = normalizeSkill(skill.name)
      const entry = demandBySkill.get(key) || { name: skill.name, openings: 0, roles: [] }
      entry.openings += skill.openings
      if (!entry.roles.some(item => item.title === role.title)) entry.roles.push({
        title: role.title,
        openings: skill.openings,
        currentMatchScore: role.currentMatchScore,
        projectedMatchScore: role.requiredSkillCount
          ? Math.round((role.coveredSkillCount + 1) / role.requiredSkillCount * 100)
          : null,
        projectedMatchLift: role.currentMatchScore !== null && role.requiredSkillCount
          ? Math.round((role.coveredSkillCount + 1) / role.requiredSkillCount * 100) - role.currentMatchScore
          : null,
      })
      demandBySkill.set(key, entry)
    }
  }

  const missingSkills = [...demandBySkill.values()].map(skill => ({
    name: skill.name,
    requiredInOpenings: skill.openings,
    openingSharePercent: allOpenings ? Math.round(skill.openings / allOpenings * 100) : 0,
    priority: priorityFor(skill.openings, allOpenings),
    roles: skill.roles.sort((left, right) => (right.projectedMatchLift ?? -1) - (left.projectedMatchLift ?? -1) || right.openings - left.openings),
  })).sort((left, right) => right.requiredInOpenings - left.requiredInOpenings || left.name.localeCompare(right.name))

  const learningRecommendations = missingSkills.map(skill => {
    const bestRole = skill.roles[0] || null
    return {
      skill: skill.name,
      priority: skill.priority,
      requiredInOpenings: skill.requiredInOpenings,
      roles: skill.roles,
      bestRole: bestRole ? bestRole.title : null,
      currentMatchScore: bestRole?.currentMatchScore ?? null,
      projectedMatchScore: bestRole?.projectedMatchScore ?? null,
      projectedMatchLift: bestRole && bestRole.currentMatchScore !== null && bestRole.projectedMatchScore !== null
        ? bestRole.projectedMatchScore - bestRole.currentMatchScore
        : null,
      explanation: `${skill.name} is requested by ${skill.requiredInOpenings} of ${allOpenings} active opening${allOpenings === 1 ? '' : 's'} in your target roles.`,
      practicePlan: [
        `Learn the core concepts and terminology of ${skill.name}.`,
        `Complete a focused exercise using ${skill.name} in a realistic task for ${bestRole?.title || 'your target role'}.`,
        `Build a small work sample and document the problem, your approach, and the result in your profile.`,
      ],
      catalogConnected: false,
    }
  })

  return {
    source: preview ? 'sample-preview' : 'saved-profile',
    preview,
    profileSkills: [...profileSkills.values()].map(skill => ({
      name: skill.name,
      evidenceSources: [...skill.sources],
      aliases: skill.names,
    })),
    targetTitles,
    availableOpenings: targetJobs.length,
    analyzedOpenings: jobs.length,
    targetRoles: roleSummaries,
    missingSkills,
    learningRecommendations,
    limitations: [
      'Gap and match results compare profile skill names and project/work evidence with skills listed on active job postings; they do not assess actual proficiency.',
      'Projected match changes are skill-coverage estimates only, not predictions of interviews or hiring outcomes.',
      'Learning suggestions are generated practice plans. No course catalog or provider resource directory is connected yet.',
    ],
  }
}

module.exports = {
  buildCandidateSkillAnalysis,
  candidateExperience,
  collectProfileSkills,
  experienceEligibility,
  isFresher,
  normalizeSkill,
}
