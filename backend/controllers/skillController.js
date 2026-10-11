const Skill = require('../models/Skill')

function toCanonicalId(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const defaultSkills = [
  { canonicalId: 'python', name: 'Python', category: 'Programming Languages', targetRoles: ['Software Developer (Fresher)', 'Data Analyst', 'Backend Developer'], aliases: ['Python3', 'py'] },
  { canonicalId: 'javascript', name: 'JavaScript', category: 'Web Development', targetRoles: ['Frontend Developer', 'Full Stack Developer', 'Software Developer (Fresher)'], aliases: ['JS', 'ES6'] },
  { canonicalId: 'typescript', name: 'TypeScript', category: 'Web Development', targetRoles: ['Frontend Developer', 'Full Stack Developer'], aliases: ['TS'] },
  { canonicalId: 'react', name: 'React', category: 'Web Development', targetRoles: ['Frontend Developer', 'Full Stack Developer', 'Software Developer (Fresher)'], aliases: ['React.js', 'ReactJS'] },
  { canonicalId: 'node-js', name: 'Node.js', category: 'Web Development', targetRoles: ['Backend Developer', 'Full Stack Developer'], aliases: ['Node', 'NodeJS'] },
  { canonicalId: 'express-js', name: 'Express.js', category: 'Web Development', targetRoles: ['Backend Developer', 'Full Stack Developer'], aliases: ['Express'] },
  { canonicalId: 'rest-api-development', name: 'REST API Development', category: 'Web Development', targetRoles: ['Backend Developer', 'Full Stack Developer', 'Software Developer (Fresher)'], aliases: ['REST APIs', 'RESTful APIs', 'API Design'] },
  { canonicalId: 'sql', name: 'SQL', category: 'Databases', targetRoles: ['Data Analyst', 'Backend Developer', 'Software Developer (Fresher)'], aliases: ['Structured Query Language', 'PostgreSQL', 'MySQL'] },
  { canonicalId: 'database-query-optimization', name: 'Database Query Optimization', category: 'Databases', targetRoles: ['Backend Developer', 'Database Administrator'], aliases: ['Query Tuning', 'SQL Optimization'] },
  { canonicalId: 'data-analysis', name: 'Data Analysis', category: 'Data Science & Analytics', targetRoles: ['Data Analyst', 'Business Analyst'], aliases: ['Data Analytics'] },
  { canonicalId: 'power-bi', name: 'Power BI', category: 'Data Science & Analytics', targetRoles: ['Data Analyst', 'Business Intelligence Developer'], aliases: ['PowerBI'] },
  { canonicalId: 'excel', name: 'Excel', category: 'Data Science & Analytics', targetRoles: ['Data Analyst', 'Operations Associate'], aliases: ['Microsoft Excel', 'Advanced Excel'] },
  { canonicalId: 'git-github', name: 'Git & GitHub', category: 'DevOps & Tools', targetRoles: ['Software Developer (Fresher)', 'Full Stack Developer', 'Backend Developer'], aliases: ['Git', 'Version Control'] },
  { canonicalId: 'docker', name: 'Docker', category: 'DevOps & Tools', targetRoles: ['DevOps Engineer', 'Backend Developer'], aliases: ['Containerization'] },
  { canonicalId: 'machine-learning-basics', name: 'Machine Learning Basics', category: 'AI & Data Science', targetRoles: ['Data Scientist', 'AI Engineer'], aliases: ['ML', 'Machine Learning'] },
  { canonicalId: 'testing-fundamentals', name: 'Testing Fundamentals', category: 'Quality Assurance', targetRoles: ['QA Engineer', 'Software Developer (Fresher)'], aliases: ['Unit Testing', 'Software Testing'] },
  { canonicalId: 'communication-soft-skills', name: 'Communication & Soft Skills', category: 'Professional Skills', targetRoles: ['Software Developer (Fresher)', 'Data Analyst', 'Full Stack Developer'], aliases: ['Communication', 'Soft Skills'] },
]

async function ensureDefaultSkills() {
  try {
    const ops = defaultSkills.map(skill => ({
      updateOne: {
        filter: { canonicalId: skill.canonicalId },
        update: { $setOnInsert: { ...skill, status: 'approved' } },
        upsert: true,
      },
    }))
    await Skill.bulkWrite(ops, { ordered: false })
  } catch {
    // Ignore duplicate key or parallel insertion errors
  }
}

async function listSkills(req, res, next) {
  try {
    await ensureDefaultSkills()
    const skills = await Skill.find({ status: 'approved' }).sort({ name: 1 }).lean()
    const categories = [...new Set(skills.map(s => s.category).filter(Boolean))].sort()
    const roles = [...new Set(skills.flatMap(s => s.targetRoles || []).filter(Boolean))].sort()

    return res.json({
      skills,
      categories,
      roles,
    })
  } catch (error) {
    return next(error)
  }
}

async function suggestSkill(req, res, next) {
  try {
    const { name, category, targetRoles } = req.body || {}
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required.' })
    }

    const trimmedName = name.trim()
    const existing = await Skill.findOne({
      $or: [
        { name: new RegExp(`^${trimmedName}$`, 'i') },
        { aliases: new RegExp(`^${trimmedName}$`, 'i') },
      ],
    })

    if (existing) {
      return res.json({ skill: existing, alreadyExisted: true })
    }

    const created = await Skill.create({
      canonicalId: toCanonicalId(trimmedName),
      name: trimmedName,
      category: typeof category === 'string' && category.trim() ? category.trim() : 'General',
      targetRoles: Array.isArray(targetRoles) ? targetRoles.filter(r => typeof r === 'string' && r.trim()) : [],
      status: 'approved',
      suggestedBy: req.user ? req.user._id : null,
    })

    return res.status(201).json({ skill: created, alreadyExisted: false })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  listSkills,
  suggestSkill,
}
