import { useEffect, useState, useCallback } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, MessageSquare, AlertTriangle,
  Smile, Frown, Meh, Brain, Download, RefreshCw, Bot
} from 'lucide-react'
import toast from 'react-hot-toast'
import { analyticsAPI, alertsAPI, reportsAPI, chatbotAPI } from '../api/client'
import clsx from 'clsx'

const PIE_COLORS   = { positive: '#10B981', negative: '#F43F5E', neutral: '#F59E0B' }
const AREA_COLORS  = { positive: '#10B981', negative: '#F43F5E', neutral: '#F59E0B' }

function StatCard({ icon: Icon, label, value, sub, color = 'violet', trend }) {
  const colors = {
    violet:  { bg: 'bg-violet/10', border: 'border-violet/20', icon: 'text-violet-light', glow: 'shadow-glow-violet' },
    emerald: { bg: 'bg-emerald/10', border: 'border-emerald/20', icon: 'text-emerald', glow: 'shadow-glow-cyan' },
    rose:    { bg: 'bg-rose/10', border: 'border-rose/20', icon: 'text-rose-light', glow: 'shadow-glow-rose' },
    amber:   { bg: 'bg-amber/10', border: 'border-amber/20', icon: 'text-amber', glow: '' },
  }
  const c = colors[color]

  return (
    <div className={`stat-card card-hover border ${c.border}`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-4 ${c.glow}`}>
        <Icon size={18} className={c.icon} />
      </div>
      <div className="text-ghost text-xs font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-display font-bold text-white">{value}</div>
      {sub && <div className="text-ghost text-xs mt-1">{sub}</div>}
      {trend !== undefined && (
        <div className={clsx('flex items-center gap-1 text-xs mt-2', trend >= 0 ? 'text-emerald' : 'text-rose')}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  )
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="card px-4 py-2.5 shadow-card text-xs">
      <div className="font-semibold text-white capitalize">{d.name}</div>
      <div className="text-ghost mt-0.5">{d.value} entries ({d.payload.percent}%)</div>
    </div>
  )
}

function ChatBot({ analytics }) {
  const [msgs,    setMsgs]    = useState([
    { role: 'bot', text: "Hi! I'm SentimentAI. Ask me anything about your team's sentiment data." }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim() || loading) return
    const q = input.trim()
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await chatbotAPI.ask(q)
      setMsgs(m => [...m, { role: 'bot', text: res.data.response }])
    } catch {
      setMsgs(m => [...m, { role: 'bot', text: 'Sorry, I encountered an error. Please try again.' }])
    } finally { setLoading(false) }
  }

  const QUICK = [
    "Which department is most stressed?",
    "Why is satisfaction dropping?",
    "Show me active alerts",
  ]

  return (
    <div className="card flex flex-col h-full" style={{ minHeight: 400 }}>
      <div className="px-5 py-4 border-b border-slate-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-cyan/15 border border-cyan/20 flex items-center justify-center">
          <Bot size={15} className="text-cyan" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white font-display">HR AI Chatbot</div>
          <div className="text-[10px] text-ghost flex items-center gap-1">
            <span className="glow-dot w-1.5 h-1.5 bg-emerald" />
            Powered by SentimentAI
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={clsx('flex', m.role === 'user' && 'justify-end')}>
            <div className={clsx(
              'max-w-[85%] text-sm px-4 py-2.5 rounded-2xl leading-relaxed',
              m.role === 'bot'
                ? 'bg-slate-light text-ghost-light rounded-tl-sm border border-slate-border'
                : 'bg-violet/20 text-violet-light rounded-tr-sm border border-violet/30'
            )}
              dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }}
            />
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5 px-4 py-3">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-ghost/40 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Quick questions */}
      {msgs.length < 3 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {QUICK.map(q => (
            <button key={q} onClick={() => { setInput(q) }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-violet/10 text-violet-light border border-violet/20
                         hover:bg-violet/20 transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your team's sentiment..."
          className="input-field flex-1 text-sm py-2.5"
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40">
          Send
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data,     setData]     = useState(null)
  const [alerts,   setAlerts]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [deptFilter, setDeptFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [analyticsRes, alertsRes] = await Promise.all([
        analyticsAPI.summary(),
        alertsAPI.list(),
      ])
      setData(analyticsRes.data)
      setAlerts(alertsRes.data)
    } catch (e) {
      toast.error('Failed to load analytics')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCSV = async () => {
    try {
      const res = await reportsAPI.exportCSV()
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a'); a.href = url; a.download = 'sentiment_report.csv'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch { toast.error('Export failed') }
  }

  const handleResolve = async id => {
    try {
      await alertsAPI.resolve(id)
      setAlerts(a => a.map(x => x.id === id ? { ...x, is_resolved: true } : x))
      toast.success('Alert resolved')
    } catch { toast.error('Failed to resolve alert') }
  }

  if (loading) return (
    <div className="p-6 lg:p-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-72 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  )

  if (!data) return null

  const { overall_sentiment: os, department_breakdown, trend_data, top_keywords,
          avg_sentiment_score, total_feedback_count, most_stressed_dept } = data

  // Pie data
  const pieData = [
    { name: 'positive', value: os.positive, percent: os.total ? Math.round(os.positive / os.total * 100) : 0 },
    { name: 'negative', value: os.negative, percent: os.total ? Math.round(os.negative / os.total * 100) : 0 },
    { name: 'neutral',  value: os.neutral,  percent: os.total ? Math.round(os.neutral  / os.total * 100) : 0 },
  ]

  const departments = [...new Set(department_breakdown.map(d => d.department))]

  const filteredDept = deptFilter === 'all'
    ? department_breakdown
    : department_breakdown.filter(d => d.department === deptFilter)

  const scoreColor = avg_sentiment_score > 0.1 ? 'emerald' : avg_sentiment_score < -0.1 ? 'rose' : 'amber'

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Sentiment Dashboard</h1>
          <p className="text-ghost text-sm mt-1">
            Real-time employee intelligence • {total_feedback_count} feedback entries
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleCSV} className="btn-primary flex items-center gap-2 text-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare}  label="Total Feedback" value={total_feedback_count}
                  color="violet" sub="All time entries" />
        <StatCard icon={Smile}          label="Positive"       value={`${pieData[0].percent}%`}
                  color="emerald" sub={`${os.positive} entries`} />
        <StatCard icon={Frown}          label="Negative"       value={`${pieData[1].percent}%`}
                  color="rose" sub={`${os.negative} entries`} />
        <StatCard icon={AlertTriangle}  label="Active Alerts"  value={alerts.filter(a => !a.is_resolved).length}
                  color="amber" sub={most_stressed_dept ? `⚡ ${most_stressed_dept} needs attention` : 'All clear'} />
      </div>

      {/* Score bar */}
      <div className="card p-5 flex items-center gap-6">
        <div className="flex-shrink-0">
          <div className="text-xs font-semibold text-ghost uppercase tracking-wider mb-1">Org Sentiment Score</div>
          <div className={`text-4xl font-display font-bold text-${scoreColor}`}>
            {avg_sentiment_score > 0 ? '+' : ''}{avg_sentiment_score.toFixed(2)}
          </div>
          <div className="text-ghost text-xs mt-1">Scale: -1.0 (very negative) to +1.0 (very positive)</div>
        </div>
        <div className="flex-1">
          <div className="h-3 bg-ink-50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-${scoreColor}`}
              style={{ width: `${((avg_sentiment_score + 1) / 2) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-ghost mt-1 font-mono">
            <span>-1.0</span><span>0</span><span>+1.0</span>
          </div>
        </div>
      </div>

      {/* Charts row 1: Pie + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie Chart */}
        <div className="card p-5">
          <div className="text-sm font-semibold text-white font-display mb-4">Sentiment Distribution</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => (
                    <Cell key={i} fill={PIE_COLORS[e.name]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-ghost-light">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[d.name] }} />
                <span className="capitalize">{d.name}</span>
                <span className="text-white font-semibold">{d.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Area Trend Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="text-sm font-semibold text-white font-display mb-4">30-Day Sentiment Trend</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend_data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  {Object.entries(AREA_COLORS).map(([key, color]) => (
                    <linearGradient key={key} id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={color} stopOpacity={0}    />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#636D7E' }}
                  tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#636D7E' }} />
                <Tooltip
                  contentStyle={{ background: '#1E2130', border: '1px solid #2E3347', borderRadius: 12 }}
                  labelStyle={{ color: '#A8B2C4', fontSize: 11 }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Area type="monotone" dataKey="positive" stroke={AREA_COLORS.positive} fill="url(#g-positive)" strokeWidth={2} name="Positive" />
                <Area type="monotone" dataKey="negative" stroke={AREA_COLORS.negative} fill="url(#g-negative)" strokeWidth={2} name="Negative" />
                <Area type="monotone" dataKey="neutral"  stroke={AREA_COLORS.neutral}  fill="url(#g-neutral)"  strokeWidth={2} name="Neutral"  />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department breakdown + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department bar chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white font-display">Department Breakdown</div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="text-xs bg-ink-50 border border-slate-border rounded-lg px-2.5 py-1.5 text-ghost-light">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredDept} margin={{ top: 0, right: 5, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 9, fill: '#636D7E' }}
                  tickFormatter={d => d.slice(0, 4)} />
                <YAxis tick={{ fontSize: 10, fill: '#636D7E' }} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1E2130', border: '1px solid #2E3347', borderRadius: 12 }}
                  formatter={(v, n) => [`${v}%`, n]}
                />
                <Bar dataKey="positive_pct" name="Positive" fill="#10B981" radius={[4,4,0,0]} />
                <Bar dataKey="negative_pct" name="Negative" fill="#F43F5E" radius={[4,4,0,0]} />
                <Bar dataKey="neutral_pct"  name="Neutral"  fill="#F59E0B" radius={[4,4,0,0]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts panel */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white font-display flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber" /> Active Alerts
            </div>
            <span className="badge-high">{alerts.filter(a => !a.is_resolved).length} open</span>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {alerts.filter(a => !a.is_resolved).length === 0 && (
              <div className="text-center text-ghost text-sm py-6">
                <div className="text-2xl mb-2">✅</div>
                No active alerts
              </div>
            )}
            {alerts.filter(a => !a.is_resolved).map(a => (
              <div key={a.id} className="p-3 rounded-xl bg-ink-50 border border-slate-border">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-xs font-semibold text-white">{a.department || 'Company-wide'}</div>
                  <span className={`badge-${a.severity} flex-shrink-0`}>{a.severity}</span>
                </div>
                <div className="text-[11px] text-ghost leading-relaxed line-clamp-2">{a.message}</div>
                <button onClick={() => handleResolve(a.id)}
                  className="text-[10px] text-violet-light hover:text-violet mt-2 font-semibold transition-colors">
                  Mark resolved →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keywords + Chatbot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Keywords cloud */}
        <div className="card p-5">
          <div className="text-sm font-semibold text-white font-display mb-4">Top Keywords</div>
          <div className="flex flex-wrap gap-2">
            {top_keywords.map((kw, i) => {
              const sizes = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs']
              const sz    = sizes[Math.min(Math.floor(i / 3), sizes.length - 1)]
              const c     = kw.sentiment === 'positive' ? 'text-emerald' :
                            kw.sentiment === 'negative' ? 'text-rose-light' : 'text-amber'
              return (
                <span key={kw.keyword}
                  className={`${sz} ${c} font-semibold font-display opacity-${100 - i * 4} cursor-default hover:opacity-100 transition-opacity`}
                  title={`${kw.count} mentions`}>
                  {kw.keyword}
                </span>
              )
            })}
          </div>
        </div>

        {/* Chatbot */}
        <ChatBot analytics={data} />
      </div>
    </div>
  )
}
