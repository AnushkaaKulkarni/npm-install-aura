import { Dashboard } from '@/components/platform'
const labels:Record<string,string>={dashboard:'Overview',jobs:'Manage Jobs','jobs/new':'Post a Job',candidates:'Applicants',ranking:'Candidate Ranking',shortlisted:'Shortlisted Candidates',profile:'Company Profile',settings:'Settings'}
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;return <Dashboard role="employer" section={labels[section]||'Overview'}/>} 
