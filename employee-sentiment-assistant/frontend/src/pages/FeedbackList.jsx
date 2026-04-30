import { useEffect, useState } from 'react'
import { feedbackAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Search, Filter, ChevronDown, MessageSquare, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DEPARTMENTS = ['All','Engineering','Marketing','Sales','HR','Product','Finance','Design','Operations']

const SENTIMENT_BADGE = {
  positive: 'badge-positive',
  negative: 'badge-negative',
  neutral:  'badge-neutral',
}

const EMOTION_ICON = {
  stress: '😰', burnout: '🔥', anger: '😠', satisfaction: '😊',
  anxiety: '😟', joy: '😄', frustration: '😤', neutral: '😐',
}

function FeedbackModal({ fb, onClose }) {
  const sr = fb.sentiment_result
  if (!sr) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg p-6 animate-fade-up shadow-card-hover">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="font-display font-semibold text-white text-lg">Feedback Detail</div>
            <div className="text-ghost text-xs mt-0.5 font-mono">
              {fb.department} • {new Date(fb.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
              {fb.is_anonymous && ' • 🔒 Anonymous'}
            </div>
          </div>
          <button onClick={onClose} className="text-ghost hover:text-white p-1 rounded-lg hover:bg-slate-light">
            <X size={18} />
          </button>
        </div>

        <div className="bg-ink-50 rounded-xl p-4 border border-slate-border mb-4 text-ghost-light text-sm leading-relaxed">
          {fb.content}
        </div>

        <div className="flex gap-2 mb-4">
          <span className={SENTIMENT_BADGE[sr.sentiment] || 'badge-neutral'}>{sr.sentiment}</span>
          <span className="badge-neutral capitalize">{EMOTION_ICON[sr.emotion]} {sr.emotion}</span>
          <span className="badge-neutral font-mono">score: {sr.score > 0 ? '+' : ''}{sr.score.toFixed(2)}</span>
        </div>

        {sr.summary && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-ghost uppercase tracking-wider mb-1.5">AI Summary</div>
            <div className="text-ghost-light text-sm leading-relaxed">{sr.summary}</div>
          </div>
        )}

        {sr.recommendation && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-ghost uppercase tracking-wider mb-1.5">Recommendation</div>
            <div className="text-violet-light text-sm leading-relaxed bg-violet/5 rounded-xl p-3 border border-violet/20">
              {sr.recommendation}
            </div>
          </div>
        )}

        {sr.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sr.keywords.map(k => (
              <span key={k} className="px-2 py-0.5 bg-slate-light border border-slate-border rounded-md text-ghost text-xs font-mono">
                #{k}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FeedbackList() {
  const { isHROrAdmin } = useAuth()
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [dept,     setDept]     = useState('All')
  const [sentiment, setSentiment] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = {}
        if (dept !== 'All') params.department = dept
        const res = await feedbackAPI.list(params)
        setItems(res.data)
      } catch { toast.error('Failed to load feedback') }
      finally { setLoading(false) }
    }
    load()
  }, [dept])

  const filtered = items.filter(fb => {
    const matchSearch = !search || fb.content.toLowerCase().includes(search.toLowerCase())
      || fb.department.toLowerCase().includes(search.toLowerCase())
    const matchSent = sentiment === 'all' || fb.sentiment_result?.sentiment === sentiment
    return matchSearch && matchSent
  })

  const ScoreChip = ({ score }) => {
    const color = score > 0.1 ? 'text-emerald' : score < -0.1 ? 'text-rose-light' : 'text-amber'
    return <span className={`font-mono text-xs font-semibold ${color}`}>{score > 0 ? '+' : ''}{score.toFixed(2)}</span>
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            {isHROrAdmin ? 'All Feedback' : 'My Feedback'}
          </h1>
          <p className="text-ghost text-sm mt-1">{filtered.length} entries found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ghost" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search feedback..." className="input-field pl-9 py-2.5 text-sm" />
        </div>

        {isHROrAdmin && (
          <div className="relative">
            <select value={dept} onChange={e => setDept(e.target.value)}
              className="input-field appearance-none pr-8 py-2.5 text-sm w-40">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ghost pointer-events-none" />
          </div>
        )}

        <div className="flex gap-1.5">
          {['all','positive','negative','neutral'].map(s => (
            <button key={s} onClick={() => setSentiment(s)}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all',
                sentiment === s
                  ? s === 'positive' ? 'bg-emerald/20 text-emerald border border-emerald/30'
                    : s === 'negative' ? 'bg-rose/20 text-rose-light border border-rose/30'
                    : s === 'neutral' ? 'bg-amber/20 text-amber border border-amber/30'
                    : 'bg-violet/20 text-violet-light border border-violet/30'
                  : 'bg-ink-50 text-ghost border border-slate-border hover:border-violet/20'
              )}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-ghost">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <div className="font-semibold text-white mb-1">No feedback found</div>
          <div className="text-sm">Try adjusting your filters</div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-border">
                  {['Department','Feedback Preview','Sentiment','Emotion','Score','Date',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-ghost uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {filtered.map(fb => {
                  const sr = fb.sentiment_result
                  return (
                    <tr key={fb.id} className="hover:bg-slate-light/50 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-white text-xs font-semibold">{fb.department}</div>
                        {fb.is_anonymous && <div className="text-ghost text-[10px]">🔒 anon</div>}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-ghost-light text-xs leading-relaxed line-clamp-2">
                          {fb.content}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sr ? <span className={SENTIMENT_BADGE[sr.sentiment] || 'badge-neutral'}>{sr.sentiment}</span> : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-ghost-light capitalize">
                        {sr ? `${EMOTION_ICON[sr.emotion] || ''} ${sr.emotion}` : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sr ? <ScoreChip score={sr.score} /> : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ghost text-xs font-mono">
                        {new Date(fb.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(fb)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-light hover:text-violet p-1 rounded-lg">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <FeedbackModal fb={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
