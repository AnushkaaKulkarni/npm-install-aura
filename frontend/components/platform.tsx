'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { FeatureWorkspace } from './feature-workspaces'
import {
  ArrowRight, BarChart3, Bell, BookOpen, BriefcaseBusiness, Building2, Check, CheckCircle2,
  ChevronDown, ClipboardCheck, Clock3, FileText, GraduationCap, Heart, Languages, LayoutDashboard,
  Menu, MessageCircle, Search, Send, Settings, ShieldCheck, Sparkles, Target, Upload, UserRound, Users, X,
} from 'lucide-react'

export const languages = ['English','हिन्दी — Hindi','বাংলা — Bengali','తెలుగు — Telugu','मराठी — Marathi','தமிழ் — Tamil','ગુજરાતી — Gujarati','اردુ — Urdu','ಕನ್ನಡ — Kannada','ଓଡ଼ିଆ — Odia','മലയാളം — Malayalam','ਪੰਜਾਬੀ — Punjabi','অসমীয়া — Assamese','मैथिली — Maithili','संस्कृतम् — Sanskrit','कोंकणी — Konkani','नेपाली — Nepali','डोगरी — Dogri','کٲشُر — Kashmiri','ꯃꯤꯇꯩꯂꯣꯟ — Meitei','बोड़ो — Bodo','संताली — Santali','सिंधी — Sindhi']

export function LanguageSelector() {
  const [language, setLanguage] = useState('English')
  return <label className="language-select"><Languages size={15}/><select aria-label="Select language" value={language} onChange={e=>setLanguage(e.target.value)}>{languages.map(item=><option key={item}>{item}</option>)}</select><ChevronDown size={14}/></label>
}

function Logo() { return <Link href="/" className="brand"><span className="brand-sun">✦</span><span><b>RozgarLink</b><small>Your Skills, Your Opportunities.</small></span></Link> }

export function PublicHeader() { const [open,setOpen]=useState(false); return <header className="public-header"><Logo/><button className="mobile-toggle" onClick={()=>setOpen(!open)} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button><nav className={open?'public-nav open':'public-nav'}><Link href="/candidate/opportunities">Find Opportunities</Link><Link href="/candidate/interview-prep">Prepare for Interviews</Link><Link href="/candidate/learning">Learn Skills</Link><Link href="/employer/dashboard">For Employers</Link><Link href="/provider/dashboard">For Training Providers</Link><LanguageSelector/><Link href="/login" className="nav-login">Login</Link><Link href="/signup" className="button primary small">Sign Up</Link></nav></header> }

export function Landing() { const [query,setQuery]=useState(''); return <div className="public-page"><PublicHeader/><main><section className="hero"><div className="hero-copy"><span className="eyebrow"><Sparkles size={15}/> A smarter path from skills to opportunity</span><h1>Find the Right Opportunity.<br/><em>Build the Skills</em> to Get There.</h1><p>Discover opportunities that match your qualifications, understand your eligibility, identify your skill gaps, and build the skills employers need.</p><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by job title or skill"/><select aria-label="Location"><option>All India</option><option>Pune</option><option>Bengaluru</option></select><Link href={`/candidate/opportunities${query?`?q=${encodeURIComponent(query)}`:''}`} className="button primary">Search Opportunities</Link></div><div className="hero-actions"><Link href="/signup" className="button primary">Create your free profile <ArrowRight size={16}/></Link><Link href="/candidate/learning" className="button secondary">Explore learning resources</Link></div></div><div className="hero-art"><div className="hero-card"><div className="match-circle">86<small>match</small></div><h3>Skills-first matching</h3><p>Eligibility is checked separately from skill relevance.</p><div className="line green"/><div className="line blue"/><div className="line saffron"/></div><div className="hero-city">भारत · Skills · Opportunities</div></div></section><section className="section centered"><span className="eyebrow">How it works</span><h2>A clearer route to your next opportunity</h2><p className="section-lead">RozgarLink connects what you know, what employers need, and what you can learn next.</p><div className="steps">{[['01','Build your profile','Add your education, experience and skills once.'],['02','See your eligibility','Understand mandatory requirements before applying.'],['03','Close your skill gaps','Learn with resources mapped to your target roles.']].map(([n,t,d])=><div className="step" key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></div>)}</div></section></main></div> }

type AuthRole = 'candidate'|'employer'|'provider'

const authDestinations:Record<AuthRole,string>={candidate:'/candidate/dashboard',employer:'/employer/dashboard',provider:'/provider/dashboard'}
const signupRoles=[['candidate','Candidate / Job Seeker','Explore opportunities, show your skills and plan your next step.',Users],['employer','Employer / Recruiter','Publish opportunities and find eligible candidates.',Building2],['provider','Training Provider','Share learning resources that close real skill gaps.',GraduationCap]] as const

export function AuthPage({mode}:{mode:'login'|'signup'}) {
  const router=useRouter()
  const [role,setRole]=useState<AuthRole|null>(null)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [registered,setRegistered]=useState<{role:AuthRole;name:string}|null>(null)

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const values=new FormData(event.currentTarget)
    const profile=role==='candidate'
      ? {location:String(values.get('location')||'').trim(),highestEducation:String(values.get('highestEducation')||'').trim()}
      : {organizationName:String(values.get('organizationName')||'').trim(),designation:String(values.get('designation')||'').trim(),website:String(values.get('website')||'').trim()}
    const payload=mode==='login'
      ? {email:String(values.get('email')||'').trim(),password:String(values.get('password')||'')}
      : {role,fullName:String(values.get('fullName')||'').trim(),email:String(values.get('email')||'').trim(),phone:String(values.get('phone')||'').trim(),password:String(values.get('password')||''),profile}

    try {
      const apiUrl=process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/,'')
      if(!apiUrl) throw new Error('Authentication is not configured. Set NEXT_PUBLIC_API_URL and try again.')
      const response=await fetch(`${apiUrl}/auth/${mode==='signup'?'signup':'login'}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify(payload),
      })
      let result:{error?:string;user?:{role?:AuthRole;fullName?:string;verificationStatus?:string}}
      try {
        result=await response.json()
      } catch {
        throw new Error('The authentication service returned an invalid response.')
      }
      if(!response.ok) {
        setError(result.error||'We could not complete your request. Please try again.')
        return
      }
      const authenticatedRole=result.user?.role
      if(!authenticatedRole||!authDestinations[authenticatedRole]) throw new Error('The authentication service returned an invalid account role.')
      if(mode==='login') {
        router.replace(authDestinations[authenticatedRole])
      } else {
        setRegistered({role:authenticatedRole,name:result.user?.fullName||String(values.get('fullName')||'')})
      }
    } catch(error) {
      setError(error instanceof TypeError?'Unable to reach the authentication service. Check that the backend is running and try again.':error instanceof Error?error.message:'An unexpected authentication error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const isSignup=mode==='signup'
  return <div className="auth-page"><PublicHeader/><main className="auth-layout">
    <aside className="auth-aside">
      <span className="eyebrow"><Sparkles size={15}/> Skills first. Opportunity next.</span>
      <h1>{isSignup?'Make your next move count.':'Welcome back to your next opportunity.'}</h1>
      <p>{isSignup?'Create a role-specific profile to connect with the opportunities, people and learning resources that fit your goals.':'Pick up where you left off and keep moving toward work that fits your skills.'}</p>
      <div className="auth-proof"><span><CheckCircle2 size={17}/> Clear eligibility, not guesswork</span><span><CheckCircle2 size={17}/> Skills matched to real opportunities</span><span><CheckCircle2 size={17}/> Learning paths built around your goals</span></div>
      <div className="auth-aside-note"><span className="brand-sun">✦</span><span><b>RozgarLink</b><small>Your Skills, Your Opportunities.</small></span></div>
    </aside>
    <section className="auth-panel">
      <div className="auth-card">
        <span className="eyebrow">{isSignup?'Create your account':'Welcome back'}</span>
        <h2>{registered?'Your details are saved':isSignup?(role?'Complete your profile':'Who are you joining as?'):'Log in to RozgarLink'}</h2>
        <p>{registered?'Your profile has been saved and is marked pending verification. You can continue to your workspace.':isSignup?(role?'Add your contact and verification details to get started.':'Choose the stakeholder experience that best fits you.'): 'Continue building your path from skills to opportunity.'}</p>
        {registered?<div className="success-state"><CheckCircle2/><h3>Account created, {registered.name}</h3><p>Your details were saved securely. Verification is pending.</p><button type="button" className="button primary full" onClick={()=>router.replace(authDestinations[registered.role])}>Go to {registered.role==='provider'?'provider':registered.role} workspace <ArrowRight size={16}/></button></div>:isSignup&&!role?<div className="auth-role-grid">{signupRoles.map(([id,title,description,Icon])=><button type="button" className="auth-role-card" key={id} onClick={()=>setRole(id)}><span className="auth-role-icon"><Icon size={21}/></span><span className="auth-role-copy"><b>{title}</b><small>{description}</small></span><ArrowRight size={17}/></button>)}</div>:<form onSubmit={submit}>
          {isSignup&&<button type="button" className="auth-back" onClick={()=>{setRole(null);setError('')}}><ArrowRight size={14}/> Change stakeholder</button>}
          {isSignup&&<label>Full name<input name="fullName" required autoComplete="name" placeholder="Your full name"/></label>}
          <label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com"/></label>
          {isSignup&&<label>Mobile number<input name="phone" required type="tel" autoComplete="tel" minLength={8} maxLength={20} placeholder="+91 98765 43210"/></label>}
          {isSignup&&role==='candidate'&&<div className="auth-fields-grid"><label>Current location<input name="location" required autoComplete="address-level2" placeholder="City, State"/></label><label>Highest education<input name="highestEducation" required placeholder="e.g. B.Tech in Computer Science"/></label></div>}
          {isSignup&&role!=='candidate'&&<><label>Organization name<input name="organizationName" required autoComplete="organization" placeholder="Registered organization name"/></label><div className="auth-fields-grid"><label>Your position<input name="designation" required autoComplete="organization-title" placeholder="e.g. HR Manager"/></label><label>Organization website<input name="website" required type="url" placeholder="https://example.com"/></label></div></>}
          <label>Password<input name="password" required type="password" minLength={8} maxLength={72} autoComplete={isSignup?'new-password':'current-password'} placeholder={isSignup?'8–72 characters':'Your password'}/></label>
          {isSignup&&<label className="check-row auth-terms"><input name="terms" type="checkbox" required/> I agree to the terms and privacy policy.</label>}
          {error&&<p className="auth-error" role="alert">{error}</p>}
          <button className="button primary full auth-submit" disabled={loading}>{loading?'Please wait…':isSignup?'Create account':'Log in'} {!loading&&<ArrowRight size={16}/>}</button>
        </form>}
        {registered&&error&&<p className="auth-error" role="alert">{error}</p>}
        {!registered&&<p className="auth-switch">{isSignup?<>Already have an account? <Link href="/login">Log in</Link></>:<>New to RozgarLink? <Link href="/signup">Create an account</Link></>}</p>}
      </div>
      <p className="auth-security"><ShieldCheck size={15}/> Your account details are protected.</p>
    </section>
  </main></div>
}

export function RoleSelect() { const [role,setRole]=useState('candidate'); const roles=[['candidate','Candidate / Job Seeker','Discover opportunities, understand eligibility and prepare for interviews.',Users,'/candidate/dashboard'],['employer','Employer / Recruiter','Publish opportunities and discover eligible candidates.',Building2,'/employer/dashboard'],['provider','Training Provider','Publish learning materials mapped to skills and careers.',GraduationCap,'/provider/dashboard']] as const; return <div className="auth-page"><PublicHeader/><main className="role-wrap"><span className="eyebrow">One platform, three perspectives</span><h1>Choose your workspace</h1><p>Select the experience that best fits what you want to do.</p><div className="role-grid">{roles.map(([id,title,desc,I])=><button className={role===id?'role-card selected':'role-card'} onClick={()=>setRole(id)} key={id}><I/><h2>{title}</h2><p>{desc}</p><span className="radio">{role===id?'Selected':'Select'}</span></button>)}</div><Link href={`/onboarding/profile?role=${role}`} className="button primary">Continue to workspace <ArrowRight/></Link></main></div> }

type Role='candidate'|'employer'|'provider'
type EmployerAccount = {
  fullName:string
  role:string
  profile?:{
    organizationName?:string
    website?:string
    industry?:string
    companySize?:string
    description?:string
  }
}
type JobPosting = {
  id:string
  title:string
  department:string
  location:string
  workMode:string
  employmentType:string
  experience:string
  salary:string
  minExperienceYears:number|null
  maxExperienceYears:number|null
  minSalaryLpa:number|null
  maxSalaryLpa:number|null
  deadline:string
  description:string
  requiredSkills:string[]
  status:string
  createdAt:string
  employer:{name:string;website:string;industry:string}
}
type ApiResponse<T> = T & {error?:string}

function apiBaseUrl() {
  const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/,'')
  if(!base) throw new Error('The API is not configured. Set NEXT_PUBLIC_API_URL and try again.')
  return base
}

async function apiRequest<T>(path:string,options:RequestInit={}):Promise<T> {
  let response:Response
  try {
    response=await fetch(`${apiBaseUrl()}${path}`,{
      ...options,
      credentials:'include',
      headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers},
    })
  } catch {
    throw new Error('Unable to reach the API. Check that the backend is running and try again.')
  }
  let result:ApiResponse<T>
  try {
    result=await response.json()
  } catch {
    throw new Error('The API returned an invalid response.')
  }
  if(!response.ok) throw new Error(result.error||'The request could not be completed.')
  return result
}

function formatDeadline(value:string) {
  return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value))
}

const candidateLinks=[['Overview','/candidate/dashboard',LayoutDashboard],['Find Opportunities','/candidate/opportunities',Search],['My Applications','/candidate/applications',ClipboardCheck],['Saved Jobs','/candidate/saved-jobs',Heart],['Interview Preparation','/candidate/interview-prep',MessageCircle],['AI Career Assistant','/candidate/assistant',Sparkles],['Resume Studio','/candidate/resume-studio',FileText],['ATS Resume Analyzer','/candidate/ats-analyzer',ShieldCheck],['Competency Profile','/candidate/competency-profile',Target],['Skill Gap Analysis','/candidate/skill-gaps',BarChart3],['Recommended Learning / Learning Hub','/candidate/learning',BookOpen],['My Profile','/candidate/profile',UserRound]] as const
const employerLinks=[['Overview','/employer/dashboard',LayoutDashboard],['Post a Job','/employer/jobs/new',BriefcaseBusiness],['Manage Jobs','/employer/jobs',ClipboardCheck],['Applicants','/employer/candidates',Users],['Candidate Ranking','/employer/ranking',BarChart3],['Shortlisted Candidates','/employer/shortlisted',CheckCircle2],['Company Profile','/employer/profile',Building2],['Settings','/employer/settings',Settings]] as const
const providerLinks=[['Overview','/provider/dashboard',LayoutDashboard],['Upload Material','/provider/materials/new',Upload],['My Materials','/provider/materials',BookOpen],['Skills and Categories','/provider/skills',Target],['Analytics','/provider/analytics',BarChart3],['Profile and Settings','/provider/profile',Settings]] as const

function Sidebar({role,section}:{role:Role;section:string}) { const links=role==='candidate'?candidateLinks:role==='employer'?employerLinks:providerLinks; return <aside className="app-sidebar"><div className="sidebar-brand"><Logo/></div><div className="sidebar-scroll"><span className="sidebar-kicker">{role==='candidate'?'Candidate workspace':role==='employer'?'Recruiter workspace':'Training provider'}</span>{links.map(([label,url,I])=><Link className={section===label?'active':''} href={url} key={label}><I size={17}/><span>{label}</span></Link>)}</div><Link href="/" className="logout">Log out</Link></aside> }

function AppHeader({role,employerName}:{role:Role;employerName?:string}) { const name=role==='candidate'?'Candidate':role==='employer'?employerName||'Employer':'Training Provider'; const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase(); return <header className="app-header"><Logo/><div className="app-search"><Search size={16}/><span>Search {role==='candidate'?'jobs by title, skills or company':'candidates, materials or roles'}...</span></div><div className="location-chip">⌖ All India <ChevronDown size={13}/></div><button className="icon-button" aria-label="Notifications"><Bell size={18}/><i>3</i></button><LanguageSelector/><div className="profile-chip"><span>{initials}</span><div><b>{name}</b><small>{role==='candidate'?'Job seeker':role==='employer'?'Recruiter':'Training Provider'}</small></div><ChevronDown size={13}/></div></header> }

const jobs:[string,string,string,string,string,string[]][]=[['Software Developer (Fresher)','Tata Consultancy Services','Pune, Maharashtra','₹ 4 - 6 LPA','92% Match',['Python','JavaScript','React','SQL']],['Data Analyst','Accenture','Bengaluru, Karnataka','₹ 5 - 8 LPA','86% Match',['Excel','SQL','Power BI','Data Analysis']],['Junior Backend Developer','Infosys','Mysuru, Karnataka','₹ 4 - 7 LPA','78% Match',['Java','Spring Boot','SQL','APIs']]]
function StatCards({role}:{role:Role}) { const stats=role==='candidate'?[['42','Eligible Opportunities','+12 new this week'],['18','Strong Matches','Above 80% match'],['5','Applications Submitted','2 under review'],['7','Skills to Improve','View skill gaps →']]:role==='employer'?[['5','Active Jobs','2 closing soon'],['248','Total Applications','+18 this week'],['180','Eligible Candidates','Across all roles'],['32','Shortlisted','Ready to review']]:[['25','Total Resources','Across 8 skills'],['18','Published','3 under review'],['4','Drafts','Continue editing'],['12K','Total Views','This quarter']]; return <div className="stat-grid">{stats.map(([n,t,s])=><div className="stat-card" key={t}><span className="stat-icon"><BriefcaseBusiness size={19}/></span><div><strong>{n}</strong><b>{t}</b><small>{s}</small></div></div>)}</div> }
function CandidateContent({section}:{section:string}) { const [tab,setTab]=useState('Overview'); const [saved,setSaved]=useState(false); const [expanded,setExpanded]=useState<number|null>(0); const isDetail=section==='Find Opportunities'||section==='Overview'; const pageTitle=section==='Overview'?'Welcome, Aarav!':section; return <><div className="dashboard-heading"><div><span className="eyebrow">{isDetail?'Good morning':'Candidate workspace'}</span><h1>{pageTitle}</h1><p>{isDetail?'Find the right opportunities, build new skills and get job ready.':'Your personalized career toolkit, designed around your next opportunity.'}</p></div><Link href="/candidate/profile" className="button secondary">Complete profile <ArrowRight size={15}/></Link></div><StatCards role="candidate"/>{isDetail?<><section className="welcome-banner"><div><span className="eyebrow">Profile completion</span><h2>You are 85% ready for your next opportunity.</h2><p>Complete your preferences to unlock more relevant matches.</p></div><div className="progress-ring">85%</div><Link href="/candidate/profile" className="button primary">Complete profile</Link></section><div className="content-grid"><section className="panel wide"><div className="panel-heading"><div><span className="eyebrow">Recommended Opportunities for You</span><h2>Eligible and relevant roles</h2></div><Link href="/candidate/opportunities">View all <ArrowRight size={14}/></Link></div>{jobs.map(([title,company,location,salary,match,skills],i)=><article className="job-card" key={title}><div className="company-logo">{i===0?'TCS':i===1?'›':'Infosys'}</div><div className="job-main"><div className="job-title-row"><div><h3>{title}</h3><p>{company}</p></div><span className="badge success"><CheckCircle2 size={13}/> Eligible</span><span className="badge match">{match}</span></div><div className="job-meta"><span>⌖ {location}</span><span>◷ 0 - 2 years</span><span>◉ B.Tech / Any Graduate</span></div><div className="tag-row">{skills.map(s=><span className="tag" key={s}>{s}</span>)}</div></div><div className="job-side"><strong>{salary}</strong><button className="save-button" onClick={()=>setSaved(!saved)} aria-label="Save opportunity">{saved?<Heart fill="currentColor"/>:<Heart/>}</button><div><Link href="/candidate/opportunity/software-developer" className="button secondary small">View Details</Link><Link href="/candidate/applications" className="button primary small">Apply Now</Link></div></div></article>)}</section><aside className="panel assistant-panel"><div className="panel-heading"><h2><Sparkles size={17}/> AI Career Assistant</h2></div><div className="assistant-avatar"><Sparkles size={25}/></div><p>Hello! I can help you understand job requirements, prepare for interviews, learn new skills and improve your resume.</p><ul><li>Understanding job requirements</li><li>Preparing for interviews</li><li>Learning new skills</li><li>Improving your resume</li></ul><Link href="/candidate/assistant" className="button secondary full">Open assistant <ArrowRight size={14}/></Link></aside></div><section className="content-grid lower-grid"><section className="panel"><div className="panel-heading"><h2>Your Skill Progress</h2><Link href="/candidate/skill-gaps">View details <ArrowRight size={14}/></Link></div>{[['Python','80%','blue'],['SQL','70%','blue'],['Data Analysis','60%','blue'],['Power BI','40%','saffron'],['Communication','75%','green']].map(([name,score,color])=><div className="skill-row" key={name}><span>{name}</span><div className="bar"><i className={color} style={{width:score}}/></div><b>{score}</b></div>)}</section><section className="panel"><div className="panel-heading"><h2>Learning Recommendations</h2><Link href="/candidate/learning">View all <ArrowRight size={14}/></Link></div>{['Complete Python for Data Analysis','SQL for Beginners (Hindi)','Data Visualization with Power BI'].map((x,i)=><div className="learning-row" key={x}><div className="course-thumb">{i===1?'YT':'⌁'}</div><div><b>{x}</b><small>{i===0?'Coursera · 8 hours':i===1?'YouTube · 6 hours':'SWAYAM · 12 hours'}</small></div><Link href="/candidate/learning" className="button secondary small">Begin learning</Link></div>)}</section></section></>:<FeaturePage section={section} tab={tab} setTab={setTab} expanded={expanded} setExpanded={setExpanded}/>}</> }

function PublicJobListings() {
  const [jobs,setJobs]=useState<JobPosting[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [expandedJob,setExpandedJob]=useState<string|null>(null)

  useEffect(()=>{
    let active=true
    apiRequest<{jobs:JobPosting[]}>('/jobs')
      .then(result=>{if(active)setJobs(result.jobs)})
      .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load current job openings.')})
      .finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[])

  return <>
    <div className="dashboard-heading"><div><span className="eyebrow">Candidate workspace</span><h1>Find opportunities</h1><p>Explore current openings published by employers.</p></div></div>
    {error&&<p className="employer-form-error" role="alert">{error}</p>}
    {loading&&<section className="panel employer-empty-state"><p>Loading current opportunities…</p></section>}
    {!loading&&!error&&jobs.length===0&&<section className="panel employer-empty-state"><BriefcaseBusiness/><h3>No current openings</h3><p>New opportunities will appear here as employers publish them.</p></section>}
    {!loading&&jobs.length>0&&<div className="live-job-list">{jobs.map(job=><article className="panel live-job-card" key={job.id}>
      <div className="live-job-company"><span className="company-logo">{job.employer.name.slice(0,2).toUpperCase()}</span><div><h2>{job.title}</h2><p>{job.employer.name}{job.employer.industry?` · ${job.employer.industry}`:''}</p></div></div>
      <div className="live-job-facts"><span><small>Location</small><b>{job.location}</b></span><span><small>Work mode</small><b>{job.workMode}</b></span><span><small>Employment</small><b>{job.employmentType}</b></span><span><small>Experience</small><b>{job.experience}</b></span><span><small>Annual package</small><b>{job.salary}</b></span></div>
      <div className="tag-row">{job.requiredSkills.map(skill=><span className="tag" key={skill}>{skill}</span>)}</div>
      <div className="live-job-footer"><small>Apply by {formatDeadline(job.deadline)}</small><button type="button" className="button secondary small" aria-expanded={expandedJob===job.id} onClick={()=>setExpandedJob(expandedJob===job.id?null:job.id)}>{expandedJob===job.id?'Hide details':'View details'}</button></div>
      {expandedJob===job.id&&<div className="live-job-description"><h3>About this role</h3><p>{job.description}</p>{job.employer.website&&<a href={job.employer.website} target="_blank" rel="noreferrer">Visit company website <ArrowRight size={13}/></a>}</div>}
    </article>)}</div>}
  </>
}

function FeaturePage({section,tab,setTab,expanded,setExpanded}:{section:string;tab:string;setTab:(s:string)=>void;expanded:number|null;setExpanded:(n:number|null)=>void}) { const tabs=['Overview','Eligibility','Skill Match','Learning Recommendations','About Company']; return <section className="panel feature-panel"><div className="opportunity-header"><div className="company-logo large">TCS</div><div><span className="eyebrow">Recommended opportunity</span><h2>Software Developer (Fresher)</h2><p>Tata Consultancy Services · Pune, Maharashtra</p><div className="job-meta"><span>Full-time</span><span>0 - 2 years</span><span>₹ 4 - 6 LPA</span></div><div className="tag-row">{['Python','JavaScript','React','SQL'].map(x=><span className="tag" key={x}>{x}</span>)}</div></div><div className="opportunity-actions"><button className="button secondary" onClick={()=>setExpanded(expanded===99?null:99)}><Heart size={15}/> Save</button><button className="button secondary"><Send size={15}/> Share</button></div></div><div className="tabs" role="tablist">{tabs.map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t}</button>)}</div>{tab==='Overview'&&<div className="detail-columns"><div><h3>About the opportunity</h3><p>Join a technology team building scalable digital products for clients across India. This entry-level role is designed for graduates who enjoy solving problems and learning with a supportive team.</p><div className="info-grid"><div><small>Application deadline</small><b>25 Nov 2024</b></div><div><small>Employment type</small><b>Full-time · On-site</b></div><div><small>Education</small><b>B.Tech / B.E.</b></div><div><small>Experience</small><b>0 - 2 years</b></div></div></div><div className="eligibility-card"><span className="eyebrow">Eligibility assessment</span><h3><CheckCircle2/> You are eligible to apply</h3><p>All mandatory requirements are currently satisfied.</p><Link href="/candidate/apply/software-developer" className="button primary full">Apply now <ArrowRight size={14}/></Link></div></div>}{tab==='Eligibility'&&<div className="assessment"><div className="assessment-score"><div className="score-circle">100%</div><div><h3>Mandatory requirements</h3><p>Eligibility is separate from skill relevance. A strong match does not override a failed condition.</p></div></div>{['Education: B.Tech / B.E. or equivalent','Experience: 0 - 2 years accepted','Location: Available for Pune on-site work','Profile: Basic information completed'].map((x,i)=><button className="criterion" key={x} onClick={()=>setExpanded(expanded===i?null:i)}><span><CheckCircle2/> {x}</span><ChevronDown className={expanded===i?'rotate':''}/>{expanded===i&&<small>Verified against the information in your RozgarLink profile. This check is currently satisfied.</small>}</button>)}</div>}{tab==='Skill Match'&&<div className="skill-breakdown"><div className="relevance-score"><div className="score-circle blue-score">92%</div><div><h3>Strong skill relevance</h3><p>Your profile shares 6 of 7 priority skills. Evidence includes coursework, projects and profile skills.</p></div></div>{[['Matched skills','Python, SQL, JavaScript, React','green'],['Related skills','Data structures, Git, REST APIs','blue'],['Skills to build','Testing fundamentals','saffron']].map(([t,v,c])=><div className="match-row" key={t}><span className={`dot ${c}`}/><div><b>{t}</b><p>{v}</p></div><ArrowRight size={15}/></div>)}</div>}{tab==='Learning Recommendations'&&<div className="course-list">{['Complete Python for Data Analysis','React Foundations','Testing Fundamentals for Developers'].map((x,i)=><div className="course-card" key={x}><div className="course-thumb">{i+1}</div><div><h3>{x}</h3><p>{i===0?'Beginner · 8 hours · English':'Intermediate · 6 hours · Hindi and English'}</p><span className="tag">Addresses skills to build</span></div><Link href="/candidate/learning" className="button primary small">Open resource</Link></div>)}</div>}{tab==='About Company'&&<div className="company-detail"><h3>Tata Consultancy Services</h3><p>TCS is a global technology company with opportunities across engineering, data, consulting and design. Explore roles, teams and learning pathways for early-career talent.</p><div className="info-grid"><div><small>Industry</small><b>Information Technology</b></div><div><small>Company size</small><b>10,000+ employees</b></div></div></div>}</section> }

function EmployerHeading({title,description,action}:{title:string;description:string;action?:ReactNode}) {
  return <div className="dashboard-heading"><div><span className="eyebrow">Recruiter workspace</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function EmployerStats({jobs}:{jobs:JobPosting[]}) {
  const stats=[
    [String(jobs.filter(job=>job.status==='active').length),'Active jobs','Published and accepting applications'],
    ['0','Applications','No applications have been submitted yet'],
    ['0','Eligible candidates','Appears when candidates apply'],
    ['0','Shortlisted','Shortlist applicants from the pipeline'],
  ]
  return <div className="stat-grid employer-stat-grid">{stats.map(([value,title,description])=><div className="stat-card" key={title}><span className="stat-icon"><BriefcaseBusiness size={19}/></span><div><strong>{value}</strong><b>{title}</b><small>{description}</small></div></div>)}</div>
}

function EmployerOverview({account,jobs}:{account:EmployerAccount;jobs:JobPosting[]}) {
  const companyName=account.profile?.organizationName?.trim()||account.fullName||'your company'
  return <>
    <EmployerHeading title={`Welcome, ${companyName}!`} description="Manage your openings and review candidate interest from one place." action={<Link href="/employer/jobs/new" className="button primary"><BriefcaseBusiness size={15}/> Post a new job</Link>}/>
    <EmployerStats jobs={jobs}/>
    <div className="content-grid">
      <section className="panel wide">
        <div className="panel-heading"><h2>Recent job postings</h2><Link href="/employer/jobs">Manage jobs <ArrowRight size={14}/></Link></div>
        <div className="table-wrap"><table><thead><tr><th>Job title</th><th>Applications</th><th>Eligible</th><th>Status</th><th>Deadline</th><th>Actions</th></tr></thead>
          <tbody>{jobs.slice(0,5).map(job=><tr key={job.id}><td><b>{job.title}</b><small>{job.department} · {job.location}</small></td><td>0</td><td>—</td><td><span className={`badge ${job.status==='active'?'success':'warning'}`}>{job.status}</span></td><td>{formatDeadline(job.deadline)}</td><td><Link href="/employer/candidates" className="button secondary small">Applicants</Link></td></tr>)}</tbody>
        </table></div>
        {jobs.length===0&&<div className="employer-empty-state"><BriefcaseBusiness/><h3>No job postings yet</h3><p>Create your first opening to make it visible to candidates.</p><Link href="/employer/jobs/new" className="button primary">Post a job</Link></div>}
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Hiring activity</h2><Link href="/employer/candidates">Applicants <ArrowRight size={14}/></Link></div>
        <div className="employer-empty-state compact"><Users/><h3>No applicants yet</h3><p>Applications from candidates will appear here.</p></div>
      </section>
    </div>
  </>
}

function PostJobContent({onCreated}:{onCreated:(job:JobPosting)=>void}) {
  const [saving,setSaving]=useState(false)
  const [created,setCreated]=useState<JobPosting|null>(null)
  const [error,setError]=useState('')
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const form=event.currentTarget
    const values=new FormData(form)
    try {
      const result=await apiRequest<{job:JobPosting}>('/jobs',{
        method:'POST',
        body:JSON.stringify({
          title:String(values.get('title')||'').trim(),
          department:String(values.get('department')||'').trim(),
          location:String(values.get('location')||'').trim(),
          workMode:String(values.get('workMode')||''),
          employmentType:String(values.get('employmentType')||''),
          minExperienceYears:Number(values.get('minExperienceYears')),
          maxExperienceYears:Number(values.get('maxExperienceYears')),
          minSalaryLpa:values.get('minSalaryLpa')?Number(values.get('minSalaryLpa')):null,
          maxSalaryLpa:values.get('maxSalaryLpa')?Number(values.get('maxSalaryLpa')):null,
          deadline:String(values.get('deadline')||''),
          description:String(values.get('description')||'').trim(),
          requiredSkills:String(values.get('skills')||'').split(',').map(skill=>skill.trim()).filter(Boolean),
        }),
      })
      form.reset()
      setCreated(result.job)
      onCreated(result.job)
    } catch(error) {
      setError(error instanceof Error?error.message:'Unable to save this job. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <EmployerHeading title="Post a job" description="Add the role details candidates need to understand the opportunity."/>
    <section className="panel employer-form-panel">
      <div className="panel-heading"><h2>Job details</h2><span className="helper">Required fields are marked in the form. Posting saves to your recruiter account.</span></div>
      {created&&<div className="employer-success" role="status"><CheckCircle2/><div><b>{created.title} is now published</b><small>Candidates can now find this role in Find Opportunities.</small></div><Link href="/employer/jobs" className="button secondary small">Manage jobs</Link></div>}
      {error&&<p className="employer-form-error" role="alert">{error}</p>}
      <form className="employer-form" onSubmit={submit}>
        <label>Job title<input name="title" required placeholder="e.g. Frontend Developer"/></label>
        <label>Department<input name="department" required placeholder="e.g. Engineering"/></label>
        <label>Location<input name="location" required placeholder="City, state or Remote"/></label>
        <label>Work mode<select name="workMode" defaultValue="" required><option value="" disabled>Select work mode</option><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label>
        <label>Employment type<select name="employmentType" defaultValue="" required><option value="" disabled>Select employment type</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label>
        <fieldset className="employer-range-group employer-form-wide">
          <legend>Required experience</legend>
          <div className="employer-range-inputs">
            <label>Minimum years<input name="minExperienceYears" type="number" min="0" max="60" step="1" required defaultValue="0"/></label>
            <label>Maximum years<input name="maxExperienceYears" type="number" min="0" max="60" step="1" required placeholder="e.g. 3"/></label>
          </div>
          <small>Enter the experience range in whole years. Use 0–0 for a fresher role.</small>
        </fieldset>
        <fieldset className="employer-range-group employer-form-wide">
          <legend>Annual package <span>(optional, in LPA)</span></legend>
          <div className="employer-range-inputs">
            <label>Minimum package<input name="minSalaryLpa" type="number" min="0" max="1000" step="0.1" placeholder="e.g. 6"/></label>
            <label>Maximum package<input name="maxSalaryLpa" type="number" min="0" max="1000" step="0.1" placeholder="e.g. 9"/></label>
          </div>
          <small>LPA means lakh per annum. Leave both fields blank if the package is not specified.</small>
        </fieldset>
        <label>Application deadline<input name="deadline" type="date" required/></label>
        <label className="employer-form-wide">Role description<textarea name="description" required rows={5} placeholder="Describe the role, responsibilities and what success looks like."/></label>
        <label className="employer-form-wide">Required skills<input name="skills" required placeholder="Add skills separated by commas, e.g. React, TypeScript, SQL"/></label>
        <div className="employer-form-actions employer-form-wide">
          <button className="button primary" type="submit" disabled={saving}>{saving?'Saving job…':'Publish job'} {!saving&&<ArrowRight size={15}/>}</button>
        </div>
      </form>
    </section>
  </>
}

function ManageJobsContent({jobs}:{jobs:JobPosting[]}) {
  return <>
    <EmployerHeading title="Manage jobs" description="Review your published roles, application volume and closing dates." action={<Link href="/employer/jobs/new" className="button primary"><BriefcaseBusiness size={15}/> Post a new job</Link>}/>
    <section className="panel employer-table-panel">
      <div className="panel-heading"><h2>All job postings</h2><span className="helper">{jobs.length} {jobs.length===1?'role':'roles'}</span></div>
      <div className="table-wrap"><table><thead><tr><th>Job title</th><th>Department</th><th>Applications</th><th>Eligible</th><th>Status</th><th>Deadline</th><th>Next step</th></tr></thead>
        <tbody>{jobs.map(job=><tr key={job.id}><td><b>{job.title}</b><small>{job.location} · {job.workMode}</small></td><td>{job.department}</td><td>0</td><td>—</td><td><span className={`badge ${job.status==='active'?'success':'warning'}`}>{job.status}</span></td><td>{formatDeadline(job.deadline)}</td><td><Link href="/employer/candidates" className="button secondary small">Review applicants</Link></td></tr>)}</tbody>
      </table></div>
      {jobs.length===0&&<div className="employer-empty-state"><BriefcaseBusiness/><h3>No job postings yet</h3><p>Post an opening to make it visible to candidates.</p><Link href="/employer/jobs/new" className="button primary">Post a job</Link></div>}
    </section>
  </>
}

function ApplicantsContent({jobs}:{jobs:JobPosting[]}) {
  return <>
    <EmployerHeading title="Applicants" description="Applications from candidates will appear here, grouped by the roles they applied for."/>
    <EmployerStats jobs={jobs}/>
    <section className="panel employer-table-panel">
      <div className="panel-heading"><h2>Applicant pipeline</h2><Link href="/employer/jobs">View jobs <ArrowRight size={14}/></Link></div>
      <div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Applied for</th><th>Skills</th><th>Match</th><th>Applied</th><th>Next step</th></tr></thead>
        <tbody></tbody>
      </table></div>
      <div className="employer-empty-state"><Users/><h3>No applications yet</h3><p>Applications will appear here when candidates apply to your published jobs.</p></div>
    </section>
  </>
}

function CandidateRankingContent() {
  return <>
    <EmployerHeading title="Candidate ranking" description="Compare applicant skills and role relevance after candidates apply to your jobs."/>
    <section className="panel employer-ranking-list">
      <div className="panel-heading"><h2>Best-matched candidates</h2><Link href="/employer/candidates">View applicants <ArrowRight size={14}/></Link></div>
      <div className="employer-empty-state"><BarChart3/><h3>Rankings will appear here</h3><p>Candidate rankings will be available once your jobs receive applications.</p></div>
    </section>
  </>
}

function ShortlistedContent() {
  return <>
    <EmployerHeading title="Shortlisted candidates" description="Your shortlist will collect applicants you choose to move forward."/>
    <section className="panel employer-ranking-list">
      <div className="panel-heading"><h2>Shortlist</h2><Link href="/employer/candidates">View applicants <ArrowRight size={14}/></Link></div>
      <div className="employer-empty-state"><CheckCircle2/><h3>No shortlisted candidates</h3><p>Shortlist candidates from your applicant pipeline when applications arrive.</p></div>
    </section>
  </>
}

function CompanyProfileContent({account,onUpdated}:{account:EmployerAccount;onUpdated:(account:EmployerAccount)=>void}) {
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [error,setError]=useState('')
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    const values=new FormData(event.currentTarget)
    try {
      const result=await apiRequest<{user:EmployerAccount}>('/auth/company-profile',{
        method:'PATCH',
        body:JSON.stringify({
          organizationName:String(values.get('organizationName')||'').trim(),
          website:String(values.get('website')||'').trim(),
          industry:String(values.get('industry')||'').trim(),
          companySize:String(values.get('companySize')||'').trim(),
          description:String(values.get('description')||'').trim(),
        }),
      })
      onUpdated(result.user)
      setSaved(true)
    } catch(error) {
      setError(error instanceof Error?error.message:'Unable to save the company profile.')
    } finally {
      setSaving(false)
    }
  }
  const profile=account.profile||{}
  return <>
    <EmployerHeading title="Company profile" description="Share your organization details with candidates exploring your opportunities."/>
    <section className="panel employer-form-panel">
      <div className="panel-heading"><h2>Organization details</h2><span className="helper">Saved to your employer account</span></div>
      {saved&&<div className="employer-success" role="status"><CheckCircle2/><div><b>Company profile saved</b><small>Your updated details are saved to your account.</small></div></div>}
      {error&&<p className="employer-form-error" role="alert">{error}</p>}
      <form className="employer-form" onSubmit={submit}>
        <label>Company name<input name="organizationName" defaultValue={profile.organizationName||''} required maxLength={160}/></label>
        <label>Industry<input name="industry" defaultValue={profile.industry||''} placeholder="e.g. Information Technology" maxLength={120}/></label>
        <label>Company size<select name="companySize" defaultValue={profile.companySize||''}><option value="">Select company size</option><option>1–50 employees</option><option>51–200 employees</option><option>201–1,000 employees</option><option>1,001+ employees</option></select></label>
        <label>Company website<input name="website" type="url" defaultValue={profile.website||''} placeholder="https://example.com" maxLength={2048}/></label>
        <label className="employer-form-wide">About the company<textarea name="description" rows={5} defaultValue={profile.description||''} maxLength={2000} placeholder="Describe your organization and the work you do."/></label>
        <div className="employer-form-actions employer-form-wide">
          <button className="button primary" type="submit" disabled={saving}>{saving?'Saving profile…':'Save company profile'}</button>
        </div>
      </form>
    </section>
  </>
}

function EmployerSettingsContent({account}:{account:EmployerAccount}) {
  const companyName=account.profile?.organizationName||account.fullName
  return <>
    <EmployerHeading title="Settings" description="Manage recruiter notifications and hiring workspace preferences."/>
    <section className="panel employer-settings-panel">
      <div className="panel-heading"><h2>Notifications</h2><span className="helper">Choose which updates you want to receive.</span></div>
      <label className="employer-setting"><span><b>New applications</b><small>Get notified when a candidate applies to one of your jobs.</small></span><input type="checkbox" defaultChecked/></label>
      <label className="employer-setting"><span><b>Candidate status updates</b><small>Receive updates when shortlisted candidates move through your pipeline.</small></span><input type="checkbox" defaultChecked/></label>
      <label className="employer-setting"><span><b>Product and hiring insights</b><small>Occasional tips and summaries to support your recruiting work.</small></span><input type="checkbox"/></label>
    </section>
    <section className="panel employer-settings-panel">
      <div className="panel-heading"><h2>Workspace</h2></div>
      <div className="employer-profile-summary"><div><b>Signed in as</b><small>{companyName} · Recruiter</small></div><Link href="/employer/profile" className="button secondary small">Edit company profile</Link></div>
    </section>
  </>
}

function EmployerContent({section,account,jobs,onJobCreated,onProfileUpdated}:{section:string;account:EmployerAccount;jobs:JobPosting[];onJobCreated:(job:JobPosting)=>void;onProfileUpdated:(account:EmployerAccount)=>void}) {
  switch(section) {
    case 'Post a Job': return <PostJobContent onCreated={onJobCreated}/>
    case 'Manage Jobs': return <ManageJobsContent jobs={jobs}/>
    case 'Applicants': return <ApplicantsContent jobs={jobs}/>
    case 'Candidate Ranking': return <CandidateRankingContent/>
    case 'Shortlisted Candidates': return <ShortlistedContent/>
    case 'Company Profile': return <CompanyProfileContent account={account} onUpdated={onProfileUpdated}/>
    case 'Settings': return <EmployerSettingsContent account={account}/>
    default: return <EmployerOverview account={account} jobs={jobs}/>
  }
}
function ProviderContent({section}:{section:string}) { return <><div className="dashboard-heading"><div><span className="eyebrow">Training provider workspace</span><h1>{section==='Overview'?'Welcome, EduSkills Academy!':section}</h1><p>Create and share learning resources to empower job seekers.</p></div><Link href="/provider/materials/new" className="button primary"><Upload size={15}/> Upload new material</Link></div><StatCards role="provider"/><section className="panel"><div className="panel-heading"><h2>{section==='My Materials'?'My materials':'Recent uploaded materials'}</h2><Link href="/provider/materials">View all <ArrowRight size={14}/></Link></div><div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Skills</th><th>Status</th><th>Views</th><th>Actions</th></tr></thead><tbody>{[['Python for Beginners (Hindi)','Video','Python','Published','3.2K'],['Data Analysis with Excel','Course','Excel, Data Analysis','Published','2.8K'],['Machine Learning Basics','Video','Machine Learning','Under Review','1.9K'],['Resume Building Guide','Document','Career Development','Published','1.5K'],['SQL Practice Questions','Exercise','SQL, Databases','Published','1.2K']].map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i}>{i===0?<b>{c}</b>:i===3?<span className={c==='Published'?'badge success':'badge warning'}>{c}</span>:c}</td>)}<td><Link href="/provider/materials" className="button secondary small">Edit</Link></td></tr>)}</tbody></table></div></section></> }

export function OpportunityDetails() { const [drawer,setDrawer]=useState(false); const [tab,setTab]=useState('Overview'); const [expanded,setExpanded]=useState<number|null>(0); return <div className="dashboard-page"><AppHeader role="candidate"/><button className="mobile-dashboard-toggle" onClick={()=>setDrawer(true)} aria-label="Open navigation"><Menu/></button><div className={drawer?'dashboard-layout drawer-open':'dashboard-layout'}><Sidebar role="candidate" section="Find Opportunities"/>{drawer&&<button className="drawer-close" onClick={()=>setDrawer(false)} aria-label="Close navigation"><X/></button>}<main className="dashboard-main"><div className="dashboard-heading"><div><span className="eyebrow">Opportunity details</span><h1>Find a role that fits your path</h1><p>Review eligibility, skill relevance and learning recommendations before you apply.</p></div><Link href="/candidate/opportunities" className="button secondary">Back to opportunities</Link></div><FeaturePage section="Find Opportunities" tab={tab} setTab={setTab} expanded={expanded} setExpanded={setExpanded}/></main></div></div> }

export function Dashboard({role,section='Overview'}:{role:Role;section?:string}) {
  const [drawer,setDrawer]=useState(false)
  const [employerAccount,setEmployerAccount]=useState<EmployerAccount|null>(null)
  const [employerJobs,setEmployerJobs]=useState<JobPosting[]>([])
  const [employerLoading,setEmployerLoading]=useState(role==='employer')
  const [employerError,setEmployerError]=useState('')

  useEffect(()=>{
    if(role!=='employer') return
    let active=true
    Promise.all([
      apiRequest<{user:EmployerAccount}>('/auth/me'),
      apiRequest<{jobs:JobPosting[]}>('/jobs/mine'),
    ]).then(([accountResult,jobsResult])=>{
      if(!active)return
      if(accountResult.user.role!=='employer')throw new Error('This workspace requires an employer account.')
      setEmployerAccount(accountResult.user)
      setEmployerJobs(jobsResult.jobs)
    }).catch(error=>{
      if(active)setEmployerError(error instanceof Error?error.message:'Unable to load the employer workspace.')
    }).finally(()=>{
      if(active)setEmployerLoading(false)
    })
    return ()=>{active=false}
  },[role])

  const pageContent=role==='candidate'
    ? section==='Find Opportunities'?<PublicJobListings/>:<><FeatureWorkspace section={section}/>{!['Interview Preparation','AI Career Assistant','Resume Studio','ATS Resume Analyzer','Skill Gap Analysis','Recommended Learning / Learning Hub','Competency Profile'].includes(section)&&<CandidateContent section={section}/>}</>
    : role==='employer'
      ? employerLoading?<div className="employer-workspace-state" role="status">Loading your recruiter workspace…</div>
        : employerError?<div className="employer-workspace-state"><p className="employer-form-error" role="alert">{employerError}</p>{employerError.toLowerCase().includes('log in')||employerError.includes('session')?<Link href="/login" className="button primary">Log in</Link>:null}</div>
          : employerAccount?<EmployerContent
            section={section}
            account={employerAccount}
            jobs={employerJobs}
            onJobCreated={job=>setEmployerJobs(current=>[job,...current.filter(item=>item.id!==job.id)])}
            onProfileUpdated={setEmployerAccount}
          />:null
      : <ProviderContent section={section}/>

  return <div className="dashboard-page"><AppHeader role={role} employerName={employerAccount?.profile?.organizationName||employerAccount?.fullName}/><button className="mobile-dashboard-toggle" onClick={()=>setDrawer(true)} aria-label="Open navigation"><Menu/></button><div className={drawer?'dashboard-layout drawer-open':'dashboard-layout'}><Sidebar role={role} section={section}/>{drawer&&<button className="drawer-close" onClick={()=>setDrawer(false)} aria-label="Close navigation"><X/></button>}<main className="dashboard-main">{pageContent}</main></div></div>
}
