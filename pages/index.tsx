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

const PIP_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFKElEQVR4AX1VW3MURRT+Ts/sNaGyuW0uELKRi8UlCaCAXCyilJalZcGLz+ovgH+Q5A9Y/AN49U18UalCiZQGTWkwQAwIZK0kEAhhk8pudmd2Z46nu3eTcIldOzvT3ae/851rE/5nMHOqtIpzz56WB2YeFDORmMrodTdCS4mkc3NbV/SyE1ffJBKU3QyDXrdYLHKmsBJcnBgrDEzfDVDMM2LRmEgTW8UhyuUKxeuYd/e61NYZu9TaGR1ubHxV0SsK/BKfG/15ZWhyvNLgUIyUUlyT038hsz1IJHPiSlChaDzg3f1qeX9/crih0bmwqQKvyIM/XlkZmp5ScF1XPMQaRygbxOqHOSYfrFVodfLHCMMQ3bsCnBjYMtTQSMM1TLf2URLmV3/ID2XvuSBXISRQlavFNu7RXywu0sTMutVKSn4K2fuyovJDucVgubHZWkI1n//1R3F8bBQpJ+JyQwNTqkkOPAxBVdoWFBavGova0JqtACEIQ97XFywfPFx3UMdEaYG5ufLgrVucgusglHlnj4vuNx0cP+2iY7uiUCMq4lBrUwIigBsfcRaHsq4fEozJSaRKxeCixlaa/fw8f1H0owYgEN9y1dtulLBzn4OjpxyktypKbhEQUiJHsArt24laJXK2qjyCO5PlgVyOU8r3w7O3J+0Gq+rhl3IrniDs6VXY2+8YApqItsoSAh057iCxBdpSY4V+37uv4x+eV3OPwjOFkrNmut6c/LuEfCGwEdrwOBEDiNY2QqJeu0txc1ohWU+yZ4HZWKV41XNpMReecku+OsBKSkfHTpmMI68S46s/edTSHGLnjijSbdFaMGHj4OPEuwlwaANfDsjEzriNq3Qkq2YfVTJuEFIqNDlgskMnocmuSDyOZang0TEfyWQeb3Q7aGmJGpYz8xEu3ijQ/r0J1Nc7Rnl3xsHqXaZiaT23EslIxpRpAM1AXCQ69Nv4Uq/L2xVFXpDk2/84uDJSFJYOQzm0sJTA9Rs+SwkYSuk04chhha4u42qDqQvFLXqU9SqcMTXDvF6rkhUtjUzPcmBbA6742YVXtikg/mSvHNH4mJ7xMHXPQ7rVQVMqIjIOdIuRsC67ne3I+hXqllq3OqoF3NVOOHmYsFIA3RgnXnyu922LgCUjARNXi4f+nGCxsp5zBaZAmpXjSGVXmOJxdVM1NWAkHgslsNKLygS/DPKF5cx8xWhKJoD3j4Pe6lNoaZIEKJMwF0CR9wOFr79dxUopCmmuJESFp2PO19Up3taBy6SL4epvnBsZW2tqbNjJ7O19HvXuib9QE54H3P8X+H0iNK3BJodaO2ObIPDxKYUDfehR0i+WjvbTNXI0M2h2wkTYVUBjtxzcmfKs4uoTk4zd1h7A80XeyJGJi7ZKn9Hz+jrC9q241CG9yARMrMhcGcX4d9eRqrXkaidlDsqUbvJ5RxdRTFrH0+ch7j6QfSf5YrmTTRI9PvuIlg7txsGODsqadq273kKOh3Mr+GpkrNYndDC1uS7mFhyaXTDWm0vA1EtoCRg5QhWc+PQ7TEf6MNxavd3W7gNZuDD3hFPlCg9eq8aDbQ+zzUmDsvX6hsvHZpQNHj48Bvr0PdLga7faK1fm7CM+/+sEBr//BamF5wC/cItZxPU1O+qlGX4ygKUPjmG4vZk2vzJrY/oxZ+YeY+jhLD6X2ODJojWf1uWNQ9qbQScPAaeP4lpdBF9qn7+M9VoFGxVJ8Z6deoAz+VUckBpJ6fWih2zvLmTbWjDi53Ghp4eWNsP4D3Ysju+tYgv2AAAAAElFTkSuQmCC'

const DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'pip2026'

const SIGNAL_BADGE: Record<string, string> = {
  supported: 'b-teal', partial: 'b-amber', friction: 'b-red',
  'high-friction': 'b-red', gap: 'b-amber', low: 'b-gray'
}
const STATUS_BADGE: Record<string, string> = {
  jira: 'b-red', decision: 'b-amber', 'api-gap': 'b-amber',
  scope: 'b-gray', backlog: 'b-gray', resolved: 'b-green'
}
const TYPE_BADGE: Record<string, string> = { api: 'b-coral', capability: 'b-purple' }
const ROADMAP_STATUS_BADGE: Record<string, string> = {
  'working-on-it': 'b-teal', 'not-started': 'b-gray', unscheduled: 'b-amber', done: 'b-green'
}
const PRIORITY_CLASS: Record<string, string> = {
  critical: 'priority-critical', high: 'priority-high',
  medium: 'priority-medium', low: 'priority-low', resolved: 'priority-resolved'
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function attempt() {
    if (password === DASHBOARD_PASSWORD) {
      sessionStorage.setItem('pip_auth', '1')
      onLogin()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPassword('')
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') attempt()
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--rf-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--rf-bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '2.5rem 2rem', width: 340,
        boxShadow: '0 8px 40px rgba(75,86,217,0.12)',
        animation: shake ? 'shake 0.4s ease' : 'none'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={PIP_LOGO} alt="Pip" style={{ width: 52, height: 52, borderRadius: 14, marginBottom: 14 }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--rf-indigo-deeper)', letterSpacing: '-0.02em' }}>Pip Dashboard</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Beta Intelligence · Rosterfy</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            onKeyDown={handleKey}
            autoFocus
            style={{
              width: '100%', border: `1px solid ${error ? '#E24B4A' : 'var(--border)'}`,
              borderRadius: 10, padding: '10px 14px', fontSize: 14,
              fontFamily: 'inherit', outline: 'none', background: 'var(--rf-bg)',
              color: 'var(--text)', transition: 'border 0.15s'
            }}
          />
          {error && <div style={{ fontSize: 11, color: '#A32D2D', marginTop: 6 }}>Incorrect password — try again</div>}
        </div>
        <button
          onClick={attempt}
          style={{
            width: '100%', background: 'var(--rf-indigo)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14,
            fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s'
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--rf-indigo-dark)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--rf-indigo)')}
        >
          Access dashboard
        </button>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

export default function Dashboard() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [data, setData] = useState<DashboardData>(initialData)
  const [tab, setTab] = useState<Tab>('overview')
  const [chatOpen, setChatOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: "Hi Brandon — drop in new feedback, Pendo data, or status updates and I'll update the dashboard automatically." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sessionStorage.getItem('pip_auth') === '1') setAuthed(true)
    setChecking(false)
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const navItems: { id: Tab; label: string; dot?: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'usecases', label: 'Use cases', dot: 'nav-dot-gray' },
    { id: 'issues', label: 'Issues & failures', dot: 'nav-dot-red', badge: data.issues.filter(i => i.priority !== 'resolved' && i.priority !== 'low').length },
    { id: 'gaps', label: 'Capability roadmap', dot: 'nav-dot-amber', badge: data.capabilityGaps.filter(g => g.priority === 'high').length },
    { id: 'feedback', label: 'Customer feedback', dot: 'nav-dot-teal' },
    { id: 'roadmap', label: 'Roadmap gaps', dot: 'nav-dot-amber' },
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

  if (checking) return null
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  return (
    <>
      <Head>
        <title>Pip — Beta Intelligence Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src={PIP_LOGO} alt="Pip" />
            <div>
              <div className="sidebar-logo-title">Pip</div>
              <div className="sidebar-logo-sub">Beta Intelligence</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
                {item.dot && <span className={`nav-dot ${item.dot}`} />}
                {item.label}
                {item.badge ? <span className="sidebar-badge">{item.badge}</span> : null}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            Last updated · {data.meta.lastUpdated}<br />
            {data.meta.betaAccounts} accounts · Pendo 90d window<br /><br />
            <span
              style={{ color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 10 }}
              onClick={() => { sessionStorage.removeItem('pip_auth'); setAuthed(false) }}
            >
              Sign out
            </span>
          </div>
        </aside>

        <main className="main">
          {tab === 'overview' && <Overview data={data} onNav={setTab} />}
          {tab === 'usecases' && <UseCases data={data} />}
          {tab === 'issues' && <Issues data={data} />}
          {tab === 'gaps' && <Gaps data={data} />}
          {tab === 'feedback' && <Feedback data={data} />}
          {tab === 'roadmap' && <Roadmap data={data} />}
        </main>

        <div className={`chat-panel ${chatOpen ? '' : 'chat-collapsed'}`}>
          <div className="chat-header">
            <div className="chat-header-inner">
              <img src={PIP_LOGO} alt="Pip" className="chat-header-logo" />
              <div>
                <div className="chat-header-title">Update dashboard</div>
                <div className="chat-header-sub">Paste feedback or Pendo data</div>
              </div>
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

function Overview({ data, onNav }: { data: DashboardData; onNav: (t: Tab) => void }) {
  const openIssues = data.issues.filter(i => i.priority !== 'resolved' && i.priority !== 'low')
  const resolvedIssues = data.issues.filter(i => i.priority === 'resolved')
  return (
    <>
      <div className="page-header">
        <div className="page-title">Beta Intelligence</div>
        <div className="page-sub">Closed beta · {data.meta.betaAccounts} accounts active · Last updated {data.meta.lastUpdated}</div>
      </div>
      <div className="metric-grid">
        <div className="metric-card"><div className="metric-label">Beta accounts</div><div className="metric-value">{data.meta.betaAccounts}</div><div className="metric-sub">Active in Pendo</div></div>
        <div className="metric-card"><div className="metric-label">Emergent use cases</div><div className="metric-value">{data.meta.emergentUseCases}</div><div className="metric-sub">Last 90 days</div></div>
        <div className="metric-card"><div className="metric-label">Open failure modes</div><div className="metric-value">{data.meta.failureModes}</div><div className="metric-sub">1 resolved this week</div></div>
        <div className="metric-card"><div className="metric-label">Capability gaps</div><div className="metric-value">{data.meta.capabilityGaps}</div><div className="metric-sub">Unsupported request types</div></div>
      </div>
      <div className="section">
        <div className="section-label">Pip's reliable core</div>
        <div className="works-grid">
          {data.reliableCore.map((item, i) => (
            <div key={i} className="works-item"><div className="works-label">Confirmed ✓</div>{item}</div>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="section-label">Issues requiring attention</div>
        {resolvedIssues.map((issue, i) => (
          <div key={i} className="resolved-banner">✓ {issue.title} — resolved · {issue.action}</div>
        ))}
        {openIssues.map((issue, i) => (
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
              <span className={`badge ${f.status === 'active' ? 'b-purple' : 'b-amber'}`}>{f.statusLabel}</span>
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
      <div className="page-header"><div className="page-title">Use cases</div><div className="page-sub">Emergent use cases · Pendo Agent Analytics · 90-day window · ~1 month live beta</div></div>
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
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>Small sample size — max 6 visitors per use case. Weight alongside qualitative feedback before prioritising.</div>
      </div>
    </>
  )
}

function Issues({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="page-header"><div className="page-title">Issues & failures</div><div className="page-sub">Reclassified from Pendo "Persistent Task Execution Failure" · 3 distinct root causes · 1 resolved</div></div>
      <div className="section">
        {data.issues.map((issue, i) => (
          <div key={i} className={`card priority-card ${PRIORITY_CLASS[issue.priority]}`}>
            <div className="card-header">
              <div style={{ flex: 1 }}>
                <div className="card-title" style={issue.priority === 'resolved' ? { textDecoration: 'line-through', color: 'var(--text-tertiary)' } : {}}>{issue.title}</div>
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
      <div className="page-header"><div className="page-title">Capability roadmap</div><div className="page-sub">Beta-identified gaps we're picking up — target dates sourced from the Pip roadmap in Monday.com</div></div>
      <div className="section">
        <div className="table-wrap">
          <table>
            <thead><tr><th style={{ width: '20%' }}>Gap</th><th>Type</th><th>Accounts affected</th><th>Unsupported rate</th><th>Action</th><th style={{ width: '13%' }}>Target</th></tr></thead>
            <tbody>
              {data.capabilityGaps.map((gap, i) => (
                <tr key={i}>
                  <td><div className="cell-name">{gap.name}</div><div className="cell-sub">{gap.description}</div></td>
                  <td><span className={`badge ${TYPE_BADGE[gap.type] || 'b-gray'}`}>{gap.typeLabel}</span></td>
                  <td>{gap.accounts.map((a, j) => <span key={j} className="account-tag">{a}</span>)}</td>
                  <td>{gap.unsupportedRate != null ? `${gap.unsupportedRate}%` : 'TBD'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{gap.action}</td>
                  <td>
                    <span className={`badge ${ROADMAP_STATUS_BADGE[gap.roadmapStatus] || 'b-gray'}`}>{gap.roadmapStatusLabel}</span>
                    {gap.targetDate && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{gap.targetDate}</div>}
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{gap.roadmapItem}</div>
                  </td>
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
              <div><div className="card-title">{f.org}</div><div className="card-sub">{f.contact}</div></div>
              <span className={`badge ${f.status === 'active' ? 'b-purple' : 'b-amber'}`}>{f.statusLabel}</span>
            </div>
            <div className="theme-list">{f.themes.map((t, j) => <span key={j} className="badge b-gray">{t}</span>)}</div>
            {f.openItems.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Open items</div>
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
