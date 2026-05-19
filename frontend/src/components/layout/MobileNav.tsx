import { Link, useLocation } from 'react-router-dom'
import { Building2, FileText, LayoutDashboard } from 'lucide-react'

export default function MobileNav() {
  const location = useLocation()
  const items = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'Ho so', icon: FileText },
    { path: '/projects', label: 'Du an', icon: Building2 },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 flex justify-around py-3 z-50">
      {items.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path
        return (
          <Link key={path} to={path} className={`flex flex-col items-center gap-1 ${active ? 'text-[#115cb9]' : 'text-slate-500'}`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span className={`text-[10px] ${active ? 'font-bold' : ''}`}>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
