const profile = {
  desiredJobTitles: ['Junior Software Developer', 'Data Analyst'],
  experienceYears: 0,
  employmentStatus: 'Student / Fresher',
  skills: [
    { name: 'JavaScript', proficiency: 'Intermediate' },
    { name: 'React', proficiency: 'Beginner' },
    { name: 'HTML', proficiency: 'Intermediate' },
    { name: 'CSS', proficiency: 'Intermediate' },
    { name: 'Git', proficiency: 'Beginner' },
  ],
  projects: [{ technologies: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'] }],
  experience: [],
}

const jobs = [
  {
    title: 'Junior Software Developer',
    minExperienceYears: 0,
    maxExperienceYears: 2,
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'Git', 'SQL'],
  },
  {
    title: 'Junior Software Developer',
    minExperienceYears: 0,
    maxExperienceYears: 1,
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'Git', 'Testing'],
  },
  {
    title: 'Data Analyst',
    minExperienceYears: 0,
    maxExperienceYears: 2,
    requiredSkills: ['SQL', 'Excel', 'Python', 'Statistics', 'Data Visualization'],
  },
  {
    title: 'Data Analyst',
    minExperienceYears: 0,
    maxExperienceYears: 3,
    requiredSkills: ['SQL', 'Excel', 'Python', 'Power BI', 'Data Visualization'],
  },
]

module.exports = { jobs, profile }
