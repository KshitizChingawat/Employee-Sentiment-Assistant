import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, User, Building2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const DEPARTMENTS = ['Engineering','Marketing','Sales','HR','Product','Finance','Design','Operations']

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', role: 'employee'
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen auth-bg flex flex-col items-center justify-center px-4 py-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
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
          <h1 className="text-xl font-display font-semibold text-white">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ghost" />
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Jane Smith" className="input-field pl-10" required />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ghost" />
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@company.com" className="input-field pl-10" required />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ghost" />
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Min 6 characters" className="input-field pl-10" required minLength={6} />
            </div>
          </div>

          {/* Department + Role row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">Department</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost" />
                <select value={form.department} onChange={e => set('department', e.target.value)}
                  className="input-field pl-9 appearance-none text-sm">
                  <option value="">Select...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="input-field appearance-none text-sm">
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Create Account</span><ArrowRight size={16} /></>
            }
          </button>

          <p className="text-center text-ghost text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-light hover:text-violet font-medium transition-colors">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
