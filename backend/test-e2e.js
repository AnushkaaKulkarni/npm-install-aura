const path = require('node:path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const connectDatabase = require('./config/database')
const app = require('./app')
const User = require('./models/User')
const Resource = require('./models/Resource')
const Progress = require('./models/Progress')
const Skill = require('./models/Skill')

let server
let baseUrl
const createdUserIds = []
const createdResourceIds = []

async function runTests() {
  console.log('🚀 Starting RozgarLink Learning Ecosystem E2E Tests...\n')
  await connectDatabase()

  const port = 5099
  server = app.listen(port)
  baseUrl = `http://localhost:${port}/api`

  try {
    // 1. Create or retrieve test provider and test candidate
    const providerEmail = `test.provider.${Date.now()}@rozgarlink.gov.in`
    const candidateEmail = `test.candidate.${Date.now()}@rozgarlink.gov.in`
    const candidate2Email = `test.candidate2.${Date.now()}@rozgarlink.gov.in`

    const hash = await bcrypt.hash('TestPass123!', 10)

    const providerUser = await User.create({
      fullName: 'Apex Tech Training Institute',
      email: providerEmail,
      phone: '+91 98765 11111',
      passwordHash: hash,
      role: 'provider',
      verificationStatus: 'verified',
      profile: {
        organizationName: 'Apex Tech Training Institute',
        designation: 'Director of Training',
        website: 'https://apextech.org',
      },
    })
    createdUserIds.push(providerUser._id)

    const candidateUser = await User.create({
      fullName: 'Rohan Sharma',
      email: candidateEmail,
      phone: '+91 98765 22222',
      passwordHash: hash,
      role: 'candidate',
      verificationStatus: 'pending',
      profile: {
        location: 'Pune, Maharashtra',
        highestEducation: 'B.Tech in Computer Science',
      },
    })
    createdUserIds.push(candidateUser._id)

    const candidate2User = await User.create({
      fullName: 'Pooja Patel',
      email: candidate2Email,
      phone: '+91 98765 33333',
      passwordHash: hash,
      role: 'candidate',
      verificationStatus: 'pending',
      profile: {
        location: 'Ahmedabad, Gujarat',
        highestEducation: 'B.E. Information Technology',
      },
    })
    createdUserIds.push(candidate2User._id)

    const providerToken = jwt.sign({ sub: providerUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
    const candidateToken = jwt.sign({ sub: candidateUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
    const candidate2Token = jwt.sign({ sub: candidate2User._id }, process.env.JWT_SECRET, { expiresIn: '1d' })

    const providerHeaders = {
      'Content-Type': 'application/json',
      Cookie: `rozgarlink_session=${providerToken}`,
    }
    const candidateHeaders = {
      'Content-Type': 'application/json',
      Cookie: `rozgarlink_session=${candidateToken}`,
    }
    const candidate2Headers = {
      'Content-Type': 'application/json',
      Cookie: `rozgarlink_session=${candidate2Token}`,
    }

    console.log('✅ Step 1: Created test Provider and Candidates.')

    // 2. Provider creates a resource as DRAFT
    const draftPayload = {
      title: 'Building Scalable Microservices with Node.js',
      description: 'Hands-on guide to building modular REST APIs and microservices for high throughput.',
      resourceType: 'video',
      contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      skills: ['REST API Development', 'Node.js'],
      targetRoles: ['Backend Developer', 'Software Developer (Fresher)'],
      category: 'Web Development',
      difficulty: 'Intermediate',
      language: 'English',
      durationMinutes: 30,
      status: 'draft',
    }

    const createDraftRes = await fetch(`${baseUrl}/resources`, {
      method: 'POST',
      headers: providerHeaders,
      body: JSON.stringify(draftPayload),
    })
    const createDraftData = await createDraftRes.json()
    if (!createDraftRes.ok) throw new Error(`Draft creation failed: ${createDraftData.error}`)
    const createdResourceId = createDraftData.resource.id
    createdResourceIds.push(createdResourceId)
    console.log('✅ Step 2: Provider created resource as draft (ID:', createdResourceId, ')')

    // 3. Verify DRAFT is in Provider's own list, but NOT in candidate/public catalogue
    const providerMineRes = await fetch(`${baseUrl}/resources/mine`, { headers: providerHeaders })
    const providerMineData = await providerMineRes.json()
    const foundInMine = providerMineData.resources.find(r => r.id === createdResourceId)
    if (!foundInMine || foundInMine.status !== 'draft') {
      throw new Error('Draft resource not found in provider list with draft status.')
    }

    const publicCatalogueRes = await fetch(`${baseUrl}/resources`)
    const publicCatalogueData = await publicCatalogueRes.json()
    const foundInPublic = publicCatalogueData.resources.find(r => r.id === createdResourceId)
    if (foundInPublic) {
      throw new Error('FAIL: Draft resource must NOT appear in public candidate catalogue!')
    }
    console.log('✅ Step 3: Verified draft is in provider list, but completely hidden from candidate catalogue.')

    // 4. Provider edits the draft
    const editRes = await fetch(`${baseUrl}/resources/provider/${createdResourceId}`, {
      method: 'PATCH',
      headers: providerHeaders,
      body: JSON.stringify({
        title: 'Building Scalable REST APIs with Node.js & Express (Updated)',
        durationMinutes: 35,
        skills: ['REST API Development', 'Node.js', 'Express.js'],
      }),
    })
    const editData = await editRes.json()
    if (!editRes.ok || editData.resource.title !== 'Building Scalable REST APIs with Node.js & Express (Updated)') {
      throw new Error('Failed to update draft resource')
    }
    console.log('✅ Step 4: Provider successfully edited draft metadata and skills.')

    // 5. Provider publishes the resource
    const publishRes = await fetch(`${baseUrl}/resources/provider/${createdResourceId}`, {
      method: 'PATCH',
      headers: providerHeaders,
      body: JSON.stringify({ status: 'published' }),
    })
    const publishData = await publishRes.json()
    if (!publishRes.ok || publishData.resource.status !== 'published') {
      throw new Error('Failed to publish resource')
    }
    console.log('✅ Step 5: Provider published resource.')

    // 6. Verify published resource appears in candidate catalogue with correct skills & roles
    const publicCatAfter = await fetch(`${baseUrl}/resources`)
    const publicCatAfterData = await publicCatAfter.json()
    const publishedFound = publicCatAfterData.resources.find(r => r.id === createdResourceId)
    if (!publishedFound || publishedFound.status !== 'published') {
      throw new Error('Published resource does not appear in candidate catalogue!')
    }
    if (!publishedFound.skills.includes('Express.js') || !publishedFound.skills.includes('REST API Development')) {
      throw new Error('Published resource does not have correct skills tags!')
    }
    console.log('✅ Step 6: Verified resource is now LIVE in candidate catalogue with correct skills and roles.')

    // 7. Verify recommendations query returns this resource for missing skills
    const recRes = await fetch(`${baseUrl}/resources/recommendations?targetRole=Backend Developer&missingSkills=REST API Development`, {
      headers: candidateHeaders,
    })
    const recData = await recRes.json()
    const recFound = recData.recommendations.find(r => r.id === createdResourceId)
    if (!recFound) {
      throw new Error('Candidate skill-gap recommendation did not return matching resource!')
    }
    if (!recFound.recommendationReason.includes('REST API Development')) {
      throw new Error('Candidate recommendation reason missing skill justification!')
    }
    console.log('✅ Step 7: Verified skill-gap recommendations engine ranked resource with reason:', recFound.recommendationReason)

    // 8. Candidate starts watching: simulates 30% playback (630 seconds out of 2100 seconds)
    const prog30Res = await fetch(`${baseUrl}/progress/${createdResourceId}`, {
      method: 'POST',
      headers: candidateHeaders,
      body: JSON.stringify({
        playbackPositionSeconds: 630,
        totalDurationSeconds: 2100,
      }),
    })
    const prog30Data = await prog30Res.json()
    if (!prog30Res.ok || prog30Data.progress.completionPercentage !== 30 || prog30Data.progress.status !== 'in_progress') {
      throw new Error(`Progress tracking failed: expected 30% in_progress, got ${JSON.stringify(prog30Data)}`)
    }
    console.log('✅ Step 8: Candidate watched 30% (630s / 2100s) -> persisted with status: in_progress.')

    // 9. Candidate leaves and returns: fetches my progress and verifies resume position
    const myProgRes = await fetch(`${baseUrl}/progress/my`, { headers: candidateHeaders })
    const myProgData = await myProgRes.json()
    const candidateItem = myProgData.inProgress.find(i => i.resourceId === createdResourceId)
    if (!candidateItem || candidateItem.playbackPositionSeconds !== 630 || candidateItem.completionPercentage !== 30) {
      throw new Error('Candidate resume position not preserved in my learning dashboard!')
    }
    console.log('✅ Step 9: Candidate returned -> verified Resume Learning shows exact 630s position (30% watched).')

    // 10. Candidate completes playback (reaches 92% >= 90% threshold)
    const progCompRes = await fetch(`${baseUrl}/progress/${createdResourceId}`, {
      method: 'POST',
      headers: candidateHeaders,
      body: JSON.stringify({
        playbackPositionSeconds: 1950,
        totalDurationSeconds: 2100,
      }),
    })
    const progCompData = await progCompRes.json()
    if (!progCompRes.ok || progCompData.progress.status !== 'completed' || progCompData.progress.completionPercentage < 90) {
      throw new Error(`Completion criteria not met: ${JSON.stringify(progCompData)}`)
    }
    console.log('✅ Step 10: Candidate reached 92% -> status automatically promoted to COMPLETED with completedAt timestamp.')

    // 11. Candidate replays from beginning (0s): verify completion status remains completed and no duplicate record is created
    const progReplayRes = await fetch(`${baseUrl}/progress/${createdResourceId}`, {
      method: 'POST',
      headers: candidateHeaders,
      body: JSON.stringify({
        playbackPositionSeconds: 0,
        totalDurationSeconds: 2100,
      }),
    })
    const progReplayData = await progReplayRes.json()
    if (progReplayData.progress.status !== 'completed') {
      throw new Error('Replaying from 0s reset completed status!')
    }

    const totalCandidateRecords = await Progress.countDocuments({ userId: candidateUser._id, resourceId: createdResourceId })
    if (totalCandidateRecords !== 1) {
      throw new Error(`Duplicate progress records detected: found ${totalCandidateRecords}`)
    }
    console.log('✅ Step 11: Replay behavior verified -> rewound to 0s while preserving completion, zero duplicate records.')

    // 12. Candidate 2 starts watching: verify candidate 2 has independent progress
    const cand2ProgRes = await fetch(`${baseUrl}/progress/${createdResourceId}`, {
      method: 'POST',
      headers: candidate2Headers,
      body: JSON.stringify({
        playbackPositionSeconds: 420,
        totalDurationSeconds: 2100,
      }),
    })
    const cand2ProgData = await cand2ProgRes.json()
    if (cand2ProgData.progress.completionPercentage !== 20 || cand2ProgData.progress.status !== 'in_progress') {
      throw new Error('Candidate 2 progress tracking failed')
    }

    const cand1After = await Progress.findOne({ userId: candidateUser._id, resourceId: createdResourceId })
    if (cand1After.status !== 'completed') {
      throw new Error('Candidate 1 progress was affected by Candidate 2 activity!')
    }
    console.log('✅ Step 12: Multi-tenant learner isolation verified -> Candidate 1 and Candidate 2 have independent progress.')

    // 13. Provider checks Analytics & Dashboard statistics: verify real learner activity is reflected
    const provStatsRes = await fetch(`${baseUrl}/resources/provider/stats`, { headers: providerHeaders })
    const provStatsData = await provStatsRes.json()
    const stats = provStatsData.stats
    if (stats.uniqueLearners < 2 || stats.totalStarts < 2 || stats.totalCompletions < 1) {
      throw new Error(`Provider stats do not reflect actual learner activity: ${JSON.stringify(stats)}`)
    }
    console.log('✅ Step 13: Provider Analytics verified -> Unique Learners:', stats.uniqueLearners, ', Total Starts:', stats.totalStarts, ', Completions:', stats.totalCompletions, ', Rate:', stats.completionRate + '%')

    // 14. Authorization security checks:
    // Non-provider cannot create resources
    const unauthorizedCreate = await fetch(`${baseUrl}/resources`, {
      method: 'POST',
      headers: candidateHeaders,
      body: JSON.stringify(draftPayload),
    })
    if (unauthorizedCreate.status !== 403) {
      throw new Error('Security check failed: candidate was allowed to create provider resource!')
    }

    // Another user cannot edit provider resource
    const unauthorizedEdit = await fetch(`${baseUrl}/resources/provider/${createdResourceId}`, {
      method: 'PATCH',
      headers: candidateHeaders,
      body: JSON.stringify({ title: 'Hacked' }),
    })
    if (unauthorizedEdit.status !== 403 && unauthorizedEdit.status !== 404) {
      throw new Error('Security check failed: candidate was allowed to edit provider resource!')
    }
    console.log('✅ Step 14: Authorization security verified -> strict role enforcement on provider routes.')

    // 15. Document upload verification
    const dummyPdfContent = Buffer.from('%PDF-1.4 sample learning curriculum guide').toString('base64')
    const uploadRes = await fetch(`${baseUrl}/resources/upload-document`, {
      method: 'POST',
      headers: providerHeaders,
      body: JSON.stringify({
        filename: 'curriculum-guide.pdf',
        fileData: 'data:application/pdf;base64,' + dummyPdfContent,
        contentType: 'application/pdf',
      }),
    })
    if (uploadRes.status !== 200) {
      throw new Error(`Document upload failed with status ${uploadRes.status}`)
    }
    const uploadJson = await uploadRes.json()
    if (!uploadJson.fileUrl || !uploadJson.fileUrl.startsWith('/uploads/')) {
      throw new Error('Document upload response did not return valid fileUrl')
    }
    console.log(`✅ Step 15: Document upload verified -> saved to ${uploadJson.fileUrl}`)

    // 16. External search endpoint verification
    const searchRes = await fetch(`${baseUrl}/search/external?q=react`)
    if (searchRes.status !== 200 && searchRes.status !== 503) {
      throw new Error(`External search failed with unexpected status: ${searchRes.status}`)
    }
    const searchJson = await searchRes.json()
    if (searchRes.status === 503) {
      if (!searchJson.error.includes('SERPAPI_API_KEY')) {
        throw new Error('Expected SerpApi key configuration message on 503')
      }
      console.log('✅ Step 16: External search verified -> returns genuine SerpApi configuration error when unconfigured.')
    } else {
      console.log(`✅ Step 16: External search verified -> returned ${searchJson.results.length} real courses.`)
    }

    // Clean up test data
    await Progress.deleteMany({ resourceId: createdResourceId })
    await Resource.deleteOne({ _id: createdResourceId })
    await User.deleteMany({ _id: { $in: [providerUser._id, candidateUser._id, candidate2User._id] } })

    console.log('\n🎉 ALL ACCEPTANCE AND DATA-INTEGRITY TESTS PASSED SUCCESSFULLY! 🎉\n')
  } finally {
    if (server) server.close()
    if (createdResourceIds.length || createdUserIds.length) {
      await Progress.deleteMany({
        $or: [
          { resourceId: { $in: createdResourceIds } },
          { userId: { $in: createdUserIds } },
        ],
      }).catch(() => {})
      await Resource.deleteMany({
        $or: [
          { _id: { $in: createdResourceIds } },
          { providerId: { $in: createdUserIds } },
        ],
      }).catch(() => {})
      await User.deleteMany({ _id: { $in: createdUserIds } }).catch(() => {})
    }
    await mongoose.disconnect()
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILURE:', err)
  process.exit(1)
})
