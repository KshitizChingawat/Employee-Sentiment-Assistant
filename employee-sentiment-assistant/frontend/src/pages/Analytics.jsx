import { useEffect, useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend, BarChart, Bar, Cell
} from 'recharts'
import { BarChart3, TrendingUp, Building2, Download, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { analyticsAPI, reportsAPI } from '../api/client'

const COLORS = ['#7C6EF5','#22D3EE','#10B981','#F59E0B','#F43F5E','#A78BFA','#34D399','#FCD34D']

export default function Analytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('departments')

  useEffect(() => {
    analyticsAPI.summary()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  const handleCSV = async () => {
    try {
      const res = await reportsAPI.exportCSV()
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a'); a.href = url; a.download = 'full_report.csv'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch { toast.error('Export failed') }
  }

  if (loading) return (
    <div className="p-6 lg:p-8 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
    </div>
  )

  if (!data) return null

  const { department_breakdown, trend_data, top_keywords } = data

  // Radar data — dept scores mapped 0-100
  const radarData = department_breakdown.slice(0, 7).map(d => ({
    dept: d.department.slice(0, 4),
    Positive: d.positive_pct,
    Negative: d.negative_pct,
    Neutral:  d.neutral_pct,
  }))

  // Scatter: score vs count
  const scatterData = department_breakdown.map((d, i) => ({
    x:    d.avg_score,
    y:    d.total,
    z:    d.negative_pct,
    name: d.department,
    fill: COLORS[i % COLORS.length],
  }))

  // Score trend line
  const scoreLine = trend_data.map(d => ({
    date:      d.date.slice(5),
    Score:     d.avg_score,
    Entries:   d.positive + d.negative + d.neutral,
  }))

  const TABS = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'trends',      label: 'Trends',      icon: TrendingUp },
    { id: 'keywords',    label: 'Keywords',     icon: BarChart3  },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Deep Analytics</h1>
          <p className="text-ghost text-sm mt-1">Comprehensive sentiment intelligence for your organization</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.location.reload()} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleCSV} className="btn-primary flex items-center gap-2 text-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-slate rounded-xl w-fit border border-slate-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-violet/20 text-violet-light border border-violet/30' : 'text-ghost hover:text-white'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── DEPARTMENTS TAB ── */}
      {tab === 'departments' && (
        <div className="space-y-4 animate-fade-in">
          {/* Department cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {department_breakdown.map((d, i) => {
              const health = d.avg_score > 0.15 ? { label:'Healthy', cls:'text-emerald', bar:'bg-emerald' }
                : d.avg_score < -0.1 ? { label:'Needs Attention', cls:'text-rose-light', bar:'bg-rose' }
                : { label:'Moderate', cls:'text-amber', bar:'bg-amber' }
              return (
                <div key={d.department} className="card card-hover p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-white font-semibold font-display text-sm">{d.department}</div>
                      <div className="text-ghost text-xs mt-0.5">{d.total} submissions</div>
                    </div>
                    <div className={`text-xs font-semibold ${health.cls}`}>{health.label}</div>
                  </div>

                  {/* Mini bar */}
                  <div className="h-1.5 bg-ink-50 rounded-full overflow-hidden flex mb-3">
                    <div className="bg-emerald h-full transition-all" style={{ width: `${d.positive_pct}%` }} />
                    <div className="bg-amber h-full transition-all"   style={{ width: `${d.neutral_pct}%` }} />
                    <div className="bg-rose h-full transition-all"    style={{ width: `${d.negative_pct}%` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                    <div><div className="text-emerald font-semibold">{d.positive_pct.toFixed(0)}%</div><div className="text-ghost">Pos</div></div>
                    <div><div className="text-amber font-semibold">{d.neutral_pct.toFixed(0)}%</div><div className="text-ghost">Neu</div></div>
                    <div><div className="text-rose-light font-semibold">{d.negative_pct.toFixed(0)}%</div><div className="text-ghost">Neg</div></div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-border">
                    <div className="text-ghost text-xs">Avg score</div>
                    <div className={`font-mono font-bold text-sm ${health.cls}`}>
                      {d.avg_score > 0 ? '+' : ''}{d.avg_score.toFixed(2)}
                    </div>
                  </div>

                  {d.top_emotions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.top_emotions.map(e => (
                        <span key={e} className="text-[9px] px-1.5 py-0.5 bg-slate-light border border-slate-border rounded text-ghost capitalize">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Radar + Scatter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="text-sm font-semibold text-white font-display mb-4">Sentiment Radar by Department</div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2E3347" />
                    <PolarAngleAxis dataKey="dept" tick={{ fontSize: 11, fill: '#636D7E' }} />
                    <Radar name="Positive" dataKey="Positive" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Negative" dataKey="Negative" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.1}  strokeWidth={2} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1E2130', border: '1px solid #2E3347', borderRadius: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <div className="text-sm font-semibold text-white font-display mb-1">Score vs Volume</div>
              <div className="text-xs text-ghost mb-4">X = avg sentiment score, Y = total submissions</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" />
                    <XAxis dataKey="x" type="number" domain={[-1, 1]} tick={{ fontSize: 10, fill: '#636D7E' }}
                      label={{ value: 'Avg Score', position: 'insideBottom', fill: '#636D7E', fontSize: 10 }} />
                    <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: '#636D7E' }} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ background: '#1E2130', border: '1px solid #2E3347', borderRadius: 12 }}
                      formatter={(v, n, p) => [v, n]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
                    />
                    <Scatter data={scatterData} shape="circle">
                      {scatterData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TRENDS TAB ── */}
      {tab === 'trends' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <div className="text-sm font-semibold text-white font-display mb-4">Sentiment Score Over Time</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreLine} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#636D7E' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#636D7E' }} domain={[-1, 1]} />
                  <Tooltip contentStyle={{ background: '#1E2130', border: '1px solid #2E3347', borderRadius: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Score" stroke="#7C6EF5" strokeWidth={2.5}
                    dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <div className="text-sm font-semibold text-white font-display mb-4">Daily Submission Volume</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreLine} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#636D7E' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#636D7E' }} />
                  <Tooltip contentStyle={{ background: '#1E2130', border: '1px solid #2E3347', borderRadius: 12 }} />
                  <Bar dataKey="Entries" fill="#7C6EF5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── KEYWORDS TAB ── */}
      {tab === 'keywords' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart */}
            <div className="card p-5">
              <div className="text-sm font-semibold text-white font-display mb-4">Keyword Frequency</div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top_keywords.slice(0, 12)} layout="vertical"
                    margin={{ top: 0, right: 20, left: 60, bottom: 0 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#636D7E' }} />
                    <YAxis type="category" dataKey="keyword" tick={{ fontSize: 11, fill: '#A8B2C4' }} />
                    <Tooltip contentStyle={{ background: '#1E2130', border: '1px solid #2E3347', borderRadius: 12 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {top_keywords.slice(0, 12).map((kw, i) => (
                        <Cell key={i}
                          fill={kw.sentiment === 'positive' ? '#10B981' : kw.sentiment === 'negative' ? '#F43F5E' : '#F59E0B'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Keyword table */}
            <div className="card p-5">
              <div className="text-sm font-semibold text-white font-display mb-4">Keyword Intelligence</div>
              <div className="space-y-2 overflow-y-auto max-h-80 pr-1">
                {top_keywords.map((kw, i) => (
                  <div key={kw.keyword} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-light transition-colors">
                    <div className="text-ghost text-xs font-mono w-5 text-right">{i + 1}</div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-semibold">#{kw.keyword}</div>
                    </div>
                    <span className={`badge-${kw.sentiment}`}>{kw.sentiment}</span>
                    <div className="text-ghost text-xs font-mono w-8 text-right">{kw.count}×</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
