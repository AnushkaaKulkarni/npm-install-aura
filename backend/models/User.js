const mongoose = require('mongoose')

const roleValues = ['candidate', 'employer', 'provider']

const educationSchema = new mongoose.Schema({
  level: { type: String, trim: true, maxlength: 80, default: '' },
  degree: { type: String, trim: true, maxlength: 120, default: '' },
  specialization: { type: String, trim: true, maxlength: 120, default: '' },
  institution: { type: String, trim: true, maxlength: 180, default: '' },
  university: { type: String, trim: true, maxlength: 180, default: '' },
  startDate: { type: String, trim: true, maxlength: 20, default: '' },
  endDate: { type: String, trim: true, maxlength: 20, default: '' },
  currentlyStudying: { type: Boolean, default: false },
  grade: { type: String, trim: true, maxlength: 40, default: '' },
  gradeScale: { type: String, trim: true, maxlength: 40, default: '' },
  coursework: { type: String, trim: true, maxlength: 1000, default: '' },
}, { _id: true })

const experienceSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 120, default: '' },
  company: { type: String, trim: true, maxlength: 160, default: '' },
  employmentType: { type: String, enum: ['', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'], default: '' },
  location: { type: String, trim: true, maxlength: 160, default: '' },
  startDate: { type: String, trim: true, maxlength: 20, default: '' },
  endDate: { type: String, trim: true, maxlength: 20, default: '' },
  currentlyWorking: { type: Boolean, default: false },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  achievements: { type: String, trim: true, maxlength: 2000, default: '' },
  skills: { type: [String], default: [] },
}, { _id: true })

const skillSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80, required: true },
  category: { type: String, enum: ['Technical', 'Programming language', 'Framework', 'Database', 'Tool', 'Cloud', 'Soft skill', 'Domain'], default: 'Technical' },
  proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
  experienceMonths: { type: Number, min: 0, max: 720, default: 0 },
  lastUsed: { type: String, trim: true, maxlength: 20, default: '' },
}, { _id: true })

const projectSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 160, default: '' },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  problemSolved: { type: String, trim: true, maxlength: 1500, default: '' },
  role: { type: String, trim: true, maxlength: 160, default: '' },
  technologies: { type: [String], default: [] },
  startDate: { type: String, trim: true, maxlength: 20, default: '' },
  endDate: { type: String, trim: true, maxlength: 20, default: '' },
  githubUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  demoUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  outcomes: { type: String, trim: true, maxlength: 1500, default: '' },
}, { _id: true })

const certificationSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 180, default: '' },
  issuer: { type: String, trim: true, maxlength: 160, default: '' },
  issueDate: { type: String, trim: true, maxlength: 20, default: '' },
  expiryDate: { type: String, trim: true, maxlength: 20, default: '' },
  credentialId: { type: String, trim: true, maxlength: 120, default: '' },
  credentialUrl: { type: String, trim: true, maxlength: 2048, default: '' },
}, { _id: true })

const achievementSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 180, default: '' },
  description: { type: String, trim: true, maxlength: 1500, default: '' },
  organization: { type: String, trim: true, maxlength: 160, default: '' },
  date: { type: String, trim: true, maxlength: 20, default: '' },
  url: { type: String, trim: true, maxlength: 2048, default: '' },
}, { _id: true })

const languageSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80, required: true },
  proficiency: { type: String, enum: ['Basic', 'Conversational', 'Professional', 'Fluent', 'Native'], default: 'Conversational' },
}, { _id: true })

const candidateProfileSchema = new mongoose.Schema({
  headline: { type: String, trim: true, maxlength: 180, default: '' },
  preferredDisplayName: { type: String, trim: true, maxlength: 100, default: '' },
  dateOfBirth: { type: String, trim: true, maxlength: 20, default: '' },
  gender: { type: String, trim: true, maxlength: 50, default: '' },
  city: { type: String, trim: true, maxlength: 100, default: '' },
  state: { type: String, trim: true, maxlength: 100, default: '' },
  country: { type: String, trim: true, maxlength: 100, default: '' },
  postalCode: { type: String, trim: true, maxlength: 20, default: '' },
  alternatePhone: { type: String, trim: true, maxlength: 24, default: '' },
  linkedinUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  githubUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  portfolioUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  desiredJobTitles: { type: [String], default: [] },
  preferredIndustries: { type: [String], default: [] },
  preferredEmploymentTypes: { type: [String], default: [] },
  preferredWorkModes: { type: [String], default: [] },
  preferredLocations: { type: [String], default: [] },
  willingToRelocate: { type: Boolean, default: false },
  expectedSalaryMin: { type: Number, min: 0, max: 100000000, default: null },
  expectedSalaryMax: { type: Number, min: 0, max: 100000000, default: null },
  currentSalary: { type: Number, min: 0, max: 100000000, default: null, select: false },
  availability: { type: String, trim: true, maxlength: 100, default: '' },
  careerLevel: { type: String, trim: true, maxlength: 80, default: '' },
  preferredCompanyTypes: { type: [String], default: [] },
  preferredJobCategories: { type: [String], default: [] },
  preferredShifts: { type: [String], default: [] },
  about: { type: String, trim: true, maxlength: 4000, default: '' },
  careerObjective: { type: String, trim: true, maxlength: 1500, default: '' },
  experienceYears: { type: Number, min: 0, max: 60, default: null },
  employmentStatus: { type: String, trim: true, maxlength: 80, default: '' },
  currentJobTitle: { type: String, trim: true, maxlength: 120, default: '' },
  currentCompany: { type: String, trim: true, maxlength: 160, default: '' },
  industryExperience: { type: [String], default: [] },
  education: { type: [educationSchema], default: [] },
  experience: { type: [experienceSchema], default: [] },
  skills: { type: [skillSchema], default: [] },
  projects: { type: [projectSchema], default: [] },
  certifications: { type: [certificationSchema], default: [] },
  achievements: { type: [achievementSchema], default: [] },
  languages: { type: [languageSchema], default: [] },
  resume: {
    fileName: { type: String, trim: true, maxlength: 255, default: '' },
    url: { type: String, trim: true, maxlength: 2048, default: '' },
    uploadedAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
}, { _id: false })

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: roleValues },
  verificationStatus: {
    type: String,
    required: true,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  profile: {
    location: { type: String, trim: true, maxlength: 120 },
    highestEducation: { type: String, trim: true, maxlength: 120 },
    organizationName: { type: String, trim: true, maxlength: 160 },
    designation: { type: String, trim: true, maxlength: 100 },
    website: { type: String, trim: true, maxlength: 2048 },
    industry: { type: String, trim: true, maxlength: 120 },
    companySize: { type: String, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 2000 },
    candidate: { type: candidateProfileSchema, default: () => ({}) },
  },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
