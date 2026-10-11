const assert = require('node:assert/strict')
const test = require('node:test')
const { jobs: previewJobs, profile: previewProfile } = require('../services/candidateAnalysisPreview')
const {
  buildCandidateSkillAnalysis,
  collectProfileSkills,
  experienceEligibility,
} = require('../services/candidateSkillAnalysis')

test('skill analysis uses profile, project, and work evidence with normalized skill names', () => {
  const skills = collectProfileSkills({
    skills: [{ name: 'JavaScript' }],
    projects: [{ technologies: ['React', 'Node.js'] }],
    experience: [{ skills: ['SQL'] }],
  })
  assert.deepEqual([...skills.keys()].sort(), ['javascript', 'nodejs', 'react', 'sql'])
  assert.deepEqual([...skills.get('react').sources], ['project technologies'])
})

test('role gaps prioritize posting demand and show role-specific projected match coverage', () => {
  const analysis = buildCandidateSkillAnalysis(previewProfile, previewJobs)
  assert.equal(analysis.preview, false)
  assert.equal(analysis.availableOpenings, 4)
  const developerRole = analysis.targetRoles.find(role => role.title === 'Junior Software Developer')
  assert.deepEqual(analysis.targetRoles.map(role => role.title), ['Data Analyst', 'Junior Software Developer'])
  assert.equal(developerRole.currentMatchScore, 43)
  assert.equal(developerRole.eligibleOpenings, 2)

  const sql = analysis.missingSkills.find(skill => skill.name === 'SQL')
  assert.equal(sql.requiredInOpenings, 3)
  assert.deepEqual(sql.roles.map(role => role.title), ['Data Analyst', 'Junior Software Developer'])
  assert.equal(sql.roles[0].projectedMatchLift, 17)

  const node = analysis.learningRecommendations.find(item => item.skill === 'Node.js')
  assert.equal(node.bestRole, 'Junior Software Developer')
  assert.equal(node.currentMatchScore, 43)
  assert.equal(node.projectedMatchScore, 57)
  assert.equal(node.projectedMatchLift, 14)
  assert.equal(node.catalogConnected, false)
  assert.match(node.practicePlan[2], /profile/)
})

test('sample profile preview is clearly marked and measures sample postings without user-specific data', () => {
  const preview = buildCandidateSkillAnalysis(previewProfile, previewJobs, { preview: true })
  assert.equal(preview.preview, true)
  assert.equal(preview.source, 'sample-preview')
  assert.equal(preview.profileSkills.length, 5)
  assert.equal(preview.availableOpenings, 4)
  assert.equal(experienceEligibility({ minExperienceYears: 2, maxExperienceYears: 5 }, null), 'unknown')
  assert.equal(experienceEligibility({ minExperienceYears: 2, maxExperienceYears: 5 }, 1), 'ineligible')
})

test('unmatched saved target titles are not silently replaced by unrelated job roles', () => {
  const analysis = buildCandidateSkillAnalysis({
    desiredJobTitles: ['Product Designer'],
    skills: [{ name: 'Figma' }],
  }, previewJobs)
  assert.equal(analysis.targetRoles.length, 0)
  assert.equal(analysis.availableOpenings, 0)
  assert.equal(analysis.missingSkills.length, 0)
})
