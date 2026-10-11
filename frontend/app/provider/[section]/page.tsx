import { Dashboard } from '@/components/platform'
const labels:Record<string,string>={dashboard:'Overview',materials:'My Materials','materials/new':'Upload Material',skills:'Skills and Categories',analytics:'Analytics',profile:'Profile and Settings'}
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;return <Dashboard role="provider" section={labels[section]||'Overview'}/>} 
