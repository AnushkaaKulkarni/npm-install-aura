import { GraduationCap, Sparkles } from 'lucide-react'

export function TutorAvatar({ speaking }: { speaking: boolean }) {
  return <div className={`tutor-avatar ${speaking ? 'is-speaking' : ''}`} role="img" aria-label={speaking ? 'Animated tutor speaking' : 'Animated tutor'}>
    <div className="avatar-orbit orbit-one"/><div className="avatar-orbit orbit-two"/>
    <div className="avatar-character"><div className="avatar-hair"/><div className="avatar-face"><span className="avatar-eye eye-left"/><span className="avatar-eye eye-right"/><span className="avatar-blush blush-left"/><span className="avatar-blush blush-right"/><span className="avatar-mouth"/></div><div className="avatar-neck"/><div className="avatar-body"><span className="avatar-collar"/><span className="avatar-badge"><GraduationCap size={19}/></span></div></div>
    <span className="avatar-sparkle sparkle-one"><Sparkles size={18}/></span><span className="avatar-sparkle sparkle-two"><Sparkles size={13}/></span>
  </div>
}
