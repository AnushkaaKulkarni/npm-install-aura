const assert = require('node:assert/strict')
const test = require('node:test')
const Application = require('../models/Application')
const User = require('../models/User')
const { applicationStatuses, serializeEmployerApplication } = require('../controllers/applicationController')
const {
  isEligible,
  candidateExperience,
  matchScore,
  normalizeSkill,
  profileCompletion,
  validateSection,
} = require('../controllers/candidateController')

test('candidate profile updates reject unsupported fields and invalid values', () => {
  assert.equal(validateSection('personal', { headline: 'Backend engineer', city: 'Pune' }), null)
  assert.match(validateSection('personal', { role: 'employer' }), /unsupported fields/)
  assert.match(validateSection('preferences', { expectedSalaryMin: 100, expectedSalaryMax: 50 }), /must not be below/)
  assert.match(validateSection('contact', { linkedinUrl: 'javascript:alert(1)' }), /http:\/\/ or https:\/\//)
  assert.match(validateSection('skills', { skills: Array(101).fill({ name: 'TypeScript' }) }), /no more than 100/)
})

test('profile completion is computed from saved fields rather than sample values', () => {
  const empty = {
    fullName: 'Candidate',
    email: 'candidate@example.test',
    phone: '1234567890',
    profile: { candidate: {} },
  }
  assert.equal(profileCompletion(empty), 0)
  assert.equal(profileCompletion({
    ...empty,
    profile: {
      location: 'Pune',
      highestEducation: 'Bachelor degree',
      candidate: {
        desiredJobTitles: ['Engineer'],
        about: 'A saved professional summary.',
        employmentStatus: 'Student / Fresher',
      },
    },
  }), 42)
})

test('candidate skill match normalizes aliases and eligibility respects experience bounds', () => {
  assert.equal(normalizeSkill('Node.js'), 'nodejs')
  assert.equal(matchScore({ requiredSkills: ['JavaScript', 'Node.js', 'SQL'] }, new Set(['javascript', 'nodejs'])), 67)
  assert.equal(isEligible({ minExperienceYears: 2, maxExperienceYears: 5 }, 2), true)
  assert.equal(isEligible({ minExperienceYears: 2, maxExperienceYears: 5 }, 5), true)
  assert.equal(isEligible({ minExperienceYears: 2, maxExperienceYears: 5 }, 6), false)
  assert.equal(isEligible({ minExperienceYears: 2 }, null), false)
  assert.equal(candidateExperience({ employmentStatus: 'Fresher' }), 0)
  assert.equal(candidateExperience({ employmentStatus: '' }), null)
})

test('candidate and application schemas preserve candidate-owned persisted data', () => {
  const user = new User({
    fullName: 'Candidate',
    email: 'candidate@example.test',
    phone: '1234567890',
    passwordHash: 'hash',
    role: 'candidate',
    profile: {
      candidate: {
        skills: [{ name: 'TypeScript', proficiency: 'Advanced' }],
        expectedSalaryMin: 500000,
      },
    },
  })
  assert.equal(user.validateSync(), undefined)
  assert.ok(Application.schema.indexes().some(([index, options]) => index.candidate === 1 && index.job === 1 && options.unique === true))
})

test('employer application summaries expose candidate application details without private salary data', () => {
  const summary = serializeEmployerApplication({
    _id: { toString: () => 'application-id' },
    status: 'Under Review',
    coverNote: 'I am interested in this role.',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    job: { _id: { toString: () => 'job-id' }, title: 'Engineer', location: 'Pune', requiredSkills: ['Node.js'] },
    candidate: {
      fullName: 'Candidate',
      email: 'candidate@example.test',
      phone: '1234567890',
      profile: {
        location: 'Pune',
        candidate: { currentSalary: 900000, skills: [{ name: 'Node.js', proficiency: 'Advanced' }] },
      },
    },
  })
  assert.deepEqual(applicationStatuses, ['Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'])
  assert.deepEqual(summary.job.requiredSkills, ['Node.js'])
  assert.equal(summary.candidate.skills[0].name, 'Node.js')
  assert.equal(Object.hasOwn(summary.candidate, 'currentSalary'), false)
})
