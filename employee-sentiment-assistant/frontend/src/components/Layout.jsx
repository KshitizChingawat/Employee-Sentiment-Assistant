import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, BarChart3, MessageSquarePlus, List,
  LogOut, Menu, X, Brain, Bell, User, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

const NAV_ADMIN = [
  { to: '/',           icon: LayoutDashboard,     label: 'Dashboard'  },
  { to: '/analytics',  icon: BarChart3,            label: 'Analytics'  },
  { to: '/feedback/list', icon: List,              label: 'All Feedback' },
  { to: '/feedback',   icon: MessageSquarePlus,    label: 'Submit Feedback' },
]

const NAV_EMPLOYEE = [
  { to: '/feedback',      icon: MessageSquarePlus, label: 'Submit Feedback' },
  { to: '/feedback/list', icon: List,              label: 'My Feedback'    },
]

export default function Layout() {
  const { user, logout, isHROrAdmin } = useAuth()
  const navigate   = useNavigate()
  const [open, setOpen] = useState(false)

  const navItems = isHROrAdmin ? NAV_ADMIN : NAV_EMPLOYEE

  const handleLogout = () => { logout(); navigate('/login') }

  const RoleChip = () => (
    <span className={clsx(
      'text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full',
      user?.role === 'admin'    && 'bg-violet/20 text-violet-light',
      user?.role === 'hr'       && 'bg-cyan/15 text-cyan',
      user?.role === 'employee' && 'bg-ghost/15 text-ghost-light',
    )}>
      {user?.role}
    </span>
  )

  const Sidebar = ({ mobile = false }) => (
    <div className={clsx(
      'flex flex-col h-full bg-slate border-r border-slate-border',
      mobile ? 'w-72' : 'w-64 hidden lg:flex',
    )}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet/20 border border-violet/30 flex items-center justify-center shadow-glow-violet">
            <Brain size={16} className="text-violet-light" />
          </div>
          <div>
            <div className="text-white font-display font-semibold text-sm leading-none">SentimentAI</div>
            <div className="text-ghost text-[10px] mt-0.5">HR Intelligence</div>
          </div>
        </div>
        {mobile && (
          <button onClick={() => setOpen(false)} className="text-ghost hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
              isActive
                ? 'bg-violet/15 text-violet-light border border-violet/20'
                : 'text-ghost-light hover:text-white hover:bg-white/5'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-violet-light' : 'text-ghost group-hover:text-white transition-colors'} />
                <span>{label}</span>
                {isActive && <ChevronRight size={12} className="ml-auto text-violet/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-slate-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-ink-50">
          <div className="w-8 h-8 rounded-full bg-violet/20 flex items-center justify-center">
            <User size={14} className="text-violet-light" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
            <RoleChip />
          </div>
          <button onClick={handleLogout} title="Logout"
            className="text-ghost hover:text-rose transition-colors p-1">
            <LogOut size={15} />
          </button>
        </div>
        {user?.department && (
          <div className="text-ghost text-[10px] text-center mt-2 font-mono">{user.department}</div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-ink overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-slate-border bg-ink/60 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setOpen(true)} className="lg:hidden text-ghost hover:text-white p-1">
            <Menu size={20} />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <Brain size={16} className="text-violet" />
            <span className="font-display font-semibold text-sm text-white">SentimentAI</span>
          </div>
          <div className="hidden lg:block" /> {/* spacer */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-ghost text-xs font-mono">
              <span className="glow-dot bg-emerald" />
              Demo Mode
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
