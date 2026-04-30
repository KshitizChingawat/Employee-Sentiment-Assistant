import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { role: 'Admin',    email: 'alice@demo.com', color: 'violet' },
  { role: 'HR',       email: 'bob@demo.com',   color: 'cyan'   },
  { role: 'Employee', email: 'david@demo.com', color: 'ghost'  },
]

export default function Login() {
  const { login }      = useAuth()
  const navigate       = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(user.role === 'employee' ? '/feedback' : '/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = email => setForm({ email, password: 'demo1234' })

  return (
    <div className="min-h-screen auth-bg flex flex-col items-center justify-center px-4">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-violet/20 border border-violet/30 flex items-center justify-center shadow-glow-violet">
              <Brain size={24} className="text-violet-light" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-display font-bold text-white">SentimentAI</div>
              <div className="text-ghost text-xs">Employee Intelligence Platform</div>
            </div>
          </div>
          <h1 className="text-xl font-display font-semibold text-white">Welcome back</h1>
          <p className="text-ghost text-sm mt-1">Sign in to your workspace</p>
        </div>

        {/* Demo Quick Login */}
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} className="text-amber" />
            <span className="text-xs font-semibold text-ghost-light uppercase tracking-wider">Quick Demo Login</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.email} onClick={() => quickLogin(a.email)}
                className="text-center py-2 px-3 rounded-xl bg-ink-50 hover:bg-slate-light border border-slate-border
                           hover:border-violet/30 transition-all duration-200 group">
                <div className={`text-xs font-semibold text-ghost-light group-hover:text-white transition-colors`}>
                  {a.role}
                </div>
                <div className="text-[10px] text-ghost mt-0.5 font-mono">{a.email.split('@')[0]}</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ghost text-center mt-2 font-mono">password: demo1234</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ghost" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ghost" />
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Sign In</span><ArrowRight size={16} /></>
            }
          </button>

          <p className="text-center text-ghost text-sm">
            No account?{' '}
            <Link to="/register" className="text-violet-light hover:text-violet font-medium transition-colors">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
