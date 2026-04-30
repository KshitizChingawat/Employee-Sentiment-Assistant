import { useState } from 'react'
import { MessageSquarePlus, Shield, ChevronDown, CheckCircle, Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import { feedbackAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

const DEPARTMENTS = ['Engineering','Marketing','Sales','HR','Product','Finance','Design','Operations']

const EMOTION_COLORS = {
  positive: 'text-emerald border-emerald/30 bg-emerald/10',
  negative: 'text-rose-light border-rose/30 bg-rose/10',
  neutral:  'text-amber border-amber/30 bg-amber/10',
}

export default function SubmitFeedback() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    content:      '',
    department:   user?.department || '',
    is_anonymous: false,
  })
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const charLimit = 2000

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.content.trim() || form.content.trim().length < 10) {
      return toast.error('Please write at least 10 characters of feedback.')
    }
    if (!form.department) return toast.error('Please select your department.')

    setLoading(true)
    try {
      const res = await feedbackAPI.submit(form)
      setResult(res.data)
      toast.success('Feedback submitted & analyzed!')
      setForm(f => ({ ...f, content: '' }))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const ScoreBar = ({ score }) => {
    const pct    = ((score + 1) / 2) * 100
    const color  = score > 0.1 ? '#10B981' : score < -0.1 ? '#F43F5E' : '#F59E0B'
    return (
      <div>
        <div className="flex justify-between text-xs text-ghost mb-1.5">
          <span>Sentiment Score</span>
          <span className="font-mono font-semibold" style={{ color }}>
            {score > 0 ? '+' : ''}{score.toFixed(2)}
          </span>
        </div>
        <div className="h-2.5 bg-ink-50 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8">
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet/15 border border-violet/25 flex items-center justify-center">
            <MessageSquarePlus size={18} className="text-violet-light" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Share Feedback</h1>
            <p className="text-ghost text-sm">Your voice helps build a better workplace</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5 animate-fade-up">
        {/* Department */}
        <div>
          <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">
            Department
          </label>
          <div className="relative">
            <select
              value={form.department}
              onChange={e => set('department', e.target.value)}
              className="input-field appearance-none pr-10"
              required
            >
              <option value="">Select your department...</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ghost pointer-events-none" />
          </div>
        </div>

        {/* Feedback content */}
        <div>
          <label className="block text-xs font-semibold text-ghost-light uppercase tracking-wider mb-2">
            Your Feedback
          </label>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value.slice(0, charLimit))}
            placeholder="Share your thoughts, concerns, or ideas. Be as honest as you'd like — this data helps HR understand and improve your work experience..."
            rows={7}
            className="input-field resize-none leading-relaxed"
            required
          />
          <div className={clsx(
            'text-right text-xs mt-1 font-mono',
            form.content.length > charLimit * 0.9 ? 'text-amber' : 'text-ghost'
          )}>
            {form.content.length} / {charLimit}
          </div>
        </div>

        {/* Anonymous toggle */}
        <div
          onClick={() => set('is_anonymous', !form.is_anonymous)}
          className={clsx(
            'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200',
            form.is_anonymous
              ? 'bg-violet/10 border-violet/30'
              : 'bg-ink-50 border-slate-border hover:border-violet/20'
          )}
        >
          <div className={clsx(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
            form.is_anonymous ? 'bg-violet border-violet' : 'border-ghost/40'
          )}>
            {form.is_anonymous && <span className="text-white text-xs">✓</span>}
          </div>
          <Shield size={15} className={form.is_anonymous ? 'text-violet-light' : 'text-ghost'} />
          <div>
            <div className="text-sm font-medium text-white">Submit Anonymously</div>
            <div className="text-xs text-ghost mt-0.5">
              Your name won't be attached. Only department-level data is visible to HR.
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || !form.content.trim() || !form.department}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing with AI...</span>
            </>
          ) : (
            <>
              <Brain size={16} />
              <span>Submit & Analyze</span>
            </>
          )}
        </button>
      </form>

      {/* AI Result card */}
      {result?.sentiment_result && (
        <div className="card p-6 mt-4 animate-fade-up border border-violet/20 shadow-glow-violet">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle size={18} className="text-emerald" />
            <div className="font-display font-semibold text-white">AI Analysis Complete</div>
          </div>

          {/* Sentiment + Emotion badges */}
          <div className="flex gap-3 mb-5">
            <div className={clsx('px-4 py-2 rounded-xl border text-sm font-semibold capitalize',
              EMOTION_COLORS[result.sentiment_result.sentiment] || EMOTION_COLORS.neutral)}>
              {result.sentiment_result.sentiment}
            </div>
            <div className="px-4 py-2 rounded-xl border border-slate-border bg-slate-light text-ghost-light text-sm capitalize">
              {result.sentiment_result.emotion}
            </div>
          </div>

          {/* Score bar */}
          <div className="mb-5">
            <ScoreBar score={result.sentiment_result.score} />
          </div>

          {/* Summary */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-ghost uppercase tracking-wider mb-2">AI Summary</div>
            <div className="text-ghost-light text-sm leading-relaxed bg-ink-50 rounded-xl p-4 border border-slate-border">
              {result.sentiment_result.summary}
            </div>
          </div>

          {/* Recommendation */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-ghost uppercase tracking-wider mb-2">HR Recommendation</div>
            <div className="text-ghost-light text-sm leading-relaxed bg-violet/5 rounded-xl p-4 border border-violet/20">
              {result.sentiment_result.recommendation}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <div className="text-xs font-semibold text-ghost uppercase tracking-wider mb-2">Key Themes</div>
            <div className="flex flex-wrap gap-2">
              {result.sentiment_result.keywords.map(kw => (
                <span key={kw} className="px-2.5 py-1 bg-slate-light border border-slate-border rounded-lg text-ghost-light text-xs font-mono">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
