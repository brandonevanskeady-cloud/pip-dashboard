import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import initialData from '../data/dashboard.json'

type DashboardData = typeof initialData
type Tab = 'overview' | 'usecases' | 'issues' | 'gaps' | 'feedback' | 'roadmap'

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  thinking?: boolean
}

const SIGNAL_BADGE: Record<string, string> = {
  supported: 'b-teal', partial: 'b-amber', friction: 'b-red',
  'high-friction': 'b-red', gap: 'b-amber', low: 'b-gray'
}

const STATUS_BADGE: Record<string, string> = {
  jira: 'b-red', decision: 'b-amber', 'api-gap': 'b-amber',
  scope: 'b-gray', backlog: 'b-gray'
}

const TYPE_BADGE: Record<string, string> = {
  api: 'b-red', capability: 'b-amber'
}

const PRIORITY_CLASS: Record<string, string> = {
  critical: 'priority-critical', high: 'priority-high',
  medium: 'priority-medium', low: 'priority-low'
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(initialData)
  const [tab, setTab] = useState<Tab>('overview')
  const [chatOpen, setChatOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: 'Hi Brandon — drop in new feedback, Pendo data, or status updates and I\'ll update the dashboard automatically.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const navItems: { id: Tab; label: string; dot?: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'usecases', label: 'Use cases', dot: 'dot-gray' },
    { id: 'issues', label: 'Issues & failures', dot: 'dot-red' },
    { id: 'gaps', label: 'Capability gaps', dot: 'dot-amber' },
    { id: 'feedback', label: 'Customer feedback', dot: 'dot-teal' },
    { id: 'roadmap', label: 'Roadmap gaps', dot: 'dot-amber' },
  ]

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'ai', content: 'Thinking...', thinking: true }])
    setLoading(true)

    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, dashboardData: data })
      })
      const result = await res.json()

      if (result.type === 'update' && result.data) {
        setData(result.data)
        setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: `✓ Dashboard updated — ${result.summary || 'changes saved'}` }])
      } else {
        setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: result.response || 'Done.' }])
      }
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      <Head>
        <title>Pip — Beta Intelligence Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-title">Pip</div>
            <div className="sidebar-logo-sub">Beta Intelligence · {data.meta.betaAccounts} accounts</div>
          </div>
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
                {item.dot && <span className={`nav-dot ${item.dot}`} />}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            Last updated<br />{data.meta.lastUpdated}<br /><br />
            Pendo · 90-day window<br />~1 month live beta
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {tab === 'overview' && <Overview data={data} />}
          {tab === 'usecases' && <UseCases data={data} />}
          {tab === 'issues' && <Issues data={data} />}
          {tab === 'gaps' && <Gaps data={data} />}
          {tab === 'feedback' && <Feedback data={data} />}
          {tab === 'roadmap' && <Roadmap data={data} />}
        </main>

        {/* Chat panel */}
        <div className={`chat-panel ${chatOpen ? '' : 'chat-collapsed'}`}>
          <div className="chat-header">
            <div>
              <div className="chat-header-title">Update dashboard</div>
              <div className="chat-header-sub">Drop in feedback or Pendo data</div>
            </div>
            <button className="chat-toggle" onClick={() => setChatOpen(o => !o)}>{chatOpen ? '−' : '+'}</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-msg-user' : m.thinking ? 'chat-msg-ai chat-msg-thinking' : 'chat-msg-ai'}`}>
                {m.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-wrap">
            <textarea className="chat-input" rows={2} placeholder="New feedback, Pendo update, status change..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
            <button className="chat-send" onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
          </div>
        </div>
      </div>
    </>
  )
}

function Overview({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="page-header">
        <div className="page-title">Overview</div>
        <div className="page-sub">Closed beta · {data.meta.betaAccounts} accounts active · Last updated {data.meta.lastUpdated}</div>
      </div>

      <div className="metric-grid">
        <div className="metric-card"><div className="metric-label">Beta accounts</div><div className="metric-value">{data.meta.betaAccounts}</div><div className="metric-sub">Active in Pendo</div></div>
        <div className="metric-card"><div className="metric-label">Emergent use cases</div><div className="metric-value">{data.meta.emergentUseCases}</div><div className="metric-sub">Last 90 days</div></div>
        <div className="metric-card"><div className="metric-label">Distinct failure modes</div><div className="metric-value">{data.meta.failureModes}</div><div className="metric-sub">Reclassified from Pendo</div></div>
        <div className="metric-card"><div className="metric-label">Capability gaps</div><div className="metric-value">{data.meta.capabilityGaps}</div><div className="metric-sub">Unsupported request types</div></div>
      </div>

      <div className="section">
        <div className="section-label">Pip's reliable core</div>
        <div className="works-grid">
          {data.reliableCore.map((item, i) => (
            <div key={i} className="works-item"><div className="works-label">Confirmed across multiple accounts</div>{item}</div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Immediate attention</div>
        {data.issues.filter(i => i.priority === 'critical' || i.priority === 'high').map((issue, i) => (
          <div key={i} className={`card priority-card ${PRIORITY_CLASS[issue.priority]}`}>
            <div className="card-header">
              <div><div className="card-title">{issue.title}</div><div className="card-sub">{issue.description}</div></div>
              <span className={`badge ${STATUS_BADGE[issue.status]}`}>{issue.statusLabel}</span>
            </div>
            <div className="card-meta">
              {issue.accounts.map((a, j) => <span key={j} className="account-tag">{a}</span>)}
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{issue.action}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-label">Customer feedback — open items</div>
        {data.customerFeedback.map((f, i) => (
          <div key={i} className="card priority-card priority-high">
            <div className="card-header">
              <div><div className="card-title">{f.org}</div><div className="card-sub">{f.contact} · {f.notes}</div></div>
              <span className={`badge ${f.status === 'active' ? 'b-blue' : 'b-amber'}`}>{f.statusLabel}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              {f.openItems.map((o, j) => <span key={j} className="open-item">⚠ {o}</span>)}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function UseCases({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="page-header"><div className="page-title">Use cases</div><div className="page-sub">Emergent use cases from Pendo Agent Analytics · 90-day window · ~1 month live beta</div></div>
      <div className="section">
        <div className="table-wrap">
          <table>
            <thead><tr><th style={{ width: '22%' }}>Use case</th><th>Conv.</th><th>Visitors</th><th>Accounts</th><th>Unsupported</th><th>Rage prompts</th><th>Retention</th><th>Signal</th></tr></thead>
            <tbody>
              {data.useCases.map((uc, i) => (
                <tr key={i}>
                  <td><div className="cell-name">{uc.name}</div><div className="cell-sub">{uc.description}</div></td>
                  <td>{uc.conversations}</td><td>{uc.visitors}</td><td>{uc.accounts}</td>
                  <td><span className={`badge ${uc.unsupportedRate === 0 ? 'b-teal' : uc.unsupportedRate === 100 ? 'b-red' : 'b-amber'}`}>{uc.unsupportedRate}%</span></td>
                  <td><span className={`badge ${uc.rageRate === 0 ? 'b-teal' : uc.rageRate >= 50 ? 'b-red' : 'b-amber'}`}>{uc.rageRate}%</span></td>
                  <td>{uc.retention}%</td>
                  <td><span className={`badge ${SIGNAL_BADGE[uc.signal] || 'b-gray'}`}>{uc.signalLabel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>Sample size is small — max 6 visitors per use case. Weight alongside qualitative feedback before prioritising.</div>
      </div>
    </>
  )
}

function Issues({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="page-header"><div className="page-title">Issues & failures</div><div className="page-sub">Reclassified from Pendo "Persistent Task Execution Failure" · 3 distinct root causes identified</div></div>
      <div className="section">
        {data.issues.map((issue, i) => (
          <div key={i} className={`card priority-card ${PRIORITY_CLASS[issue.priority]}`}>
            <div className="card-header">
              <div style={{ flex: 1 }}>
                <div className="card-title">{issue.title}</div>
                <div className="card-sub">{issue.description}</div>
              </div>
              <span className={`badge ${STATUS_BADGE[issue.status]}`}>{issue.statusLabel}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}><strong>Root cause:</strong> {issue.rootCause}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{issue.evidence}</div>
            <div className="card-meta">
              {issue.accounts.map((a, j) => <span key={j} className="account-tag">{a}</span>)}
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Action: {issue.action}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Gaps({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="page-header"><div className="page-title">Capability gaps</div><div className="page-sub">Unsupported request types identified from Pendo conversation analysis</div></div>
      <div className="section">
        <div className="table-wrap">
          <table>
            <thead><tr><th style={{ width: '22%' }}>Gap</th><th>Type</th><th>Accounts affected</th><th>Unsupported rate</th><th>Action</th></tr></thead>
            <tbody>
              {data.capabilityGaps.map((gap, i) => (
                <tr key={i}>
                  <td><div className="cell-name">{gap.name}</div><div className="cell-sub">{gap.description}</div></td>
                  <td><span className={`badge ${TYPE_BADGE[gap.type] || 'b-gray'}`}>{gap.typeLabel}</span></td>
                  <td>{gap.accounts.map((a, j) => <span key={j} className="account-tag">{a}</span>)}</td>
                  <td>{gap.unsupportedRate}%</td>
                  <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{gap.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Feedback({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="page-header"><div className="page-title">Customer feedback</div><div className="page-sub">Direct qualitative feedback from beta accounts</div></div>
      <div className="section">
        {data.customerFeedback.map((f, i) => (
          <div key={i} className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{f.org}</div>
                <div className="card-sub">{f.contact}</div>
              </div>
              <span className={`badge ${f.status === 'active' ? 'b-blue' : 'b-amber'}`}>{f.statusLabel}</span>
            </div>
            <div className="theme-list">{f.themes.map((t, j) => <span key={j} className="badge b-gray">{t}</span>)}</div>
            {f.openItems.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open items</div>
                {f.openItems.map((o, j) => <span key={j} className="open-item">⚠ {o}</span>)}
              </div>
            )}
            {f.notes && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>{f.notes}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

function Roadmap({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="page-header"><div className="page-title">Roadmap gaps</div><div className="page-sub">Items not currently on the roadmap — evidence-backed from beta signals</div></div>
      <div className="section">
        <div className="gap-grid">
          <div className="gap-card">
            <div className="gap-card-title" style={{ color: 'var(--red)' }}>Immediate — fix or mitigate now</div>
            {data.roadmapGaps.immediate.map((item, i) => (
              <div key={i} className="gap-item"><span className="gap-dot gap-dot-red" />{item}</div>
            ))}
          </div>
          <div className="gap-card">
            <div className="gap-card-title" style={{ color: 'var(--amber)' }}>Near-term — plan for next sprints</div>
            {data.roadmapGaps.nearTerm.map((item, i) => (
              <div key={i} className="gap-item"><span className="gap-dot gap-dot-amber" />{item}</div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12 }}>Reflects gaps only — items already on the roadmap are tracked separately in Monday.com.</div>
      </div>
    </>
  )
}
