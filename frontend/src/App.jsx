import { useState, useEffect } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'https://api-watchtower-0rh1.onrender.com'

/* ============ LOGIN ============ */
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('watchtower_logged_in', 'true')
      onLogin()
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">⚡</div>
        <h1>Welcome Back</h1>
        <p className="login-text">Login to access API WatchTower</p>
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required />
          <label>Password</label>
          <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login →</button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <div className="demo-box">
          <p>Demo Login</p>
          <span>Username: <b>admin</b></span>
          <span>Password: <b>admin123</b></span>
        </div>
      </div>
    </div>
  )
}

/* ============ CHART ============ */
function ResponseChart() {
  const [points, setPoints] = useState([])

  useEffect(() => {
    fetch(`${API}/api/response-trend?limit=10`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPoints(data)
      })
      .catch(() => setPoints([]))
  }, [])

  if (points.length < 2) return <p className="chart-empty">Not enough trend data yet.</p>

  const width = 600
  const height = 220
  const values = points.map(p => p.avg_response_time_ms || p.response_time || 0)
  const max = Math.max(...values, 50)
  const stepX = width / (points.length - 1)

  const linePath = points.map((p, i) => {
    const val = p.avg_response_time_ms || p.response_time || 0
    const x = i * stepX
    const y = height - (val / max) * height
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="response-chart">
      <path d={areaPath} fill="rgba(255,255,255,0.05)" />
      <path d={linePath} fill="none" stroke="#fafafa" strokeWidth="2.5" />
      {points.map((p, i) => {
        const val = p.avg_response_time_ms || p.response_time || 0
        return <circle key={i} cx={i * stepX} cy={height - (val / max) * height} r="3.5" fill="#fafafa" />
      })}
    </svg>
  )
}

/* ============ PAGE 1: DASHBOARD ============ */
function DashboardPage({ services, upCount, downCount, avgResponse, lastUpdated }) {
  return (
    <>
      <div className="dashboard-title">
        <div>
          <h1>API Monitoring Dashboard</h1>
          <p>Monitor API health, response time and uptime.</p>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card"><div className="stat-icon purple">◉</div><div><p>Total APIs</p><h2>{services.length}</h2></div></div>
        <div className="stat-card"><div className="stat-icon green">✓</div><div><p>APIs Up</p><h2>{upCount}</h2></div></div>
        <div className="stat-card"><div className="stat-icon red">!</div><div><p>APIs Down</p><h2>{downCount}</h2></div></div>
        <div className="stat-card"><div className="stat-icon blue">⚡</div><div><p>Avg Response Time</p><h2>{avgResponse} ms</h2></div></div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div><h2>Monitored APIs</h2><p>Current status of configured APIs</p></div>
          <span className="live-badge">● Live Monitoring</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>API Name</th><th>URL</th><th>Status</th><th>Response Time</th><th>Last Checked</th></tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td><span className="url-text">{s.url}</span></td>
                  <td><span className={`status ${s.status}`}>● {s.status === 'up' ? 'UP' : 'DOWN'}</span></td>
                  <td>{s.response_time_ms} ms</td>
                  <td className="last-checked">Just now</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="system-section">
        <div className="system-title"><h2>Monitoring Information</h2><p>Current monitoring system details</p></div>
        <div className="system-grid">
          <div className="system-item"><span>Monitoring Status</span><strong className="system-online">● Active</strong></div>
          <div className="system-item"><span>Check Interval</span><strong>Every 30 seconds</strong></div>
          <div className="system-item"><span>Database</span><strong className="system-online">● Connected</strong></div>
          <div className="system-item"><span>Last Update</span><strong>{lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}</strong></div>
        </div>
      </section>
    </>
  )
}

/* ============ PAGE 2: RESPONSE TIME (GRAPH) ============ */
function ResponseTimePage({ services }) {
  const upServices = services.filter(s => s.status === 'up')
  const max = Math.max(...upServices.map(s => s.response_time_ms), 1)

  const sorted = [...services].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'up' ? -1 : 1
    return b.response_time_ms - a.response_time_ms
  })

  return (
    <>
      <div className="dashboard-title">
        <div>
          <h1>Response Time</h1>
          <p>Average response time across all APIs</p>
        </div>
      </div>

      <div className="chart-card chart-page">
        <div className="chart-container">
          <ResponseChart />
        </div>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Response Time by API</h2>
            <p>Latest check for each API, slowest first</p>
          </div>
        </div>

        <div className="api-bars">
          {sorted.map(s => (
            <div className="api-bar-row" key={s.id}>
              <div className="api-bar-name">{s.name}</div>
              <div className="api-bar-track">
                {s.status === 'up' && (
                  <div
                    className="api-bar-fill"
                    style={{ width: `${(s.response_time_ms / max) * 100}%` }}
                  ></div>
                )}
              </div>
              <div className={`api-bar-value ${s.status === 'down' ? 'down' : ''}`}>
                {s.status === 'up' ? `${s.response_time_ms} ms` : 'Down'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

/* ============ PAGE 3: ALERTS (ERRORS) ============ */
function AlertsPage({ alerts }) {
  return (
    <>
      <div className="dashboard-title">
        <div>
          <h1>Alerts</h1>
          <p>Latest monitoring events</p>
        </div>
      </div>

      <div className="activity-card">
        <div className="activity-list">
          {(!alerts || alerts.length === 0) && <p className="no-data">No alerts yet.</p>}
          {alerts && alerts.slice(0, 50).map(a => (
            <div className="activity-item" key={a.id}>
              <span className="activity-dot red-dot"></span>
              <div>
                <strong>{a.service_name} unavailable</strong>
                <p>{a.message}</p>
                <small>{new Date(a.created_at || a.triggered_at || Date.now()).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ============ PAGE 4: PROFILE ============ */
function ProfilePage({ onLogout }) {
  return (
    <>
      <div className="dashboard-title">
        <div>
          <h1>Profile</h1>
          <p>Your account details</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">A</div>
        <h2>Admin</h2>
        <p className="profile-role">Administrator</p>

        <div className="profile-rows">
          <div className="profile-row"><span>Username</span><strong>admin</strong></div>
          <div className="profile-row"><span>Role</span><strong>Administrator</strong></div>
        </div>

        <button className="profile-logout" onClick={onLogout}>Logout</button>
      </div>
    </>
  )
}

/* ============ SHELL ============ */
function Dashboard({ onLogout }) {
  const [page, setPage] = useState('dashboard')
  const [services, setServices] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = () => {
    fetch(`${API}/api/services`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setServices(data)
        setLoading(false)
        setLastUpdated(new Date())
      })
      .catch(() => setLoading(false))

    fetch(`${API}/api/alerts`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAlerts(data)
      })
      .catch(() => setAlerts([]))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <p className="loading">Loading...</p>

  const upCount = services.filter(s => s.status === 'up').length
  const downCount = services.filter(s => s.status === 'down').length
  const avgResponse = services.length
    ? Math.round(services.reduce((sum, s) => sum + (s.response_time_ms || 0), 0) / services.length)
    : 0

  const handleLogout = () => {
    localStorage.removeItem('watchtower_logged_in')
    onLogout()
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'response', label: 'Response Time', icon: '📈' },
    { key: 'alerts', label: 'Alerts', icon: '🔔' },
    { key: 'profile', label: 'Profile', icon: '👤' },
  ]

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="dashboard-logo">⚡ API WatchTower</div>
        <div className="dashboard-user">
          <span>Welcome, Admin</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-shell">
        <aside className="sidebar">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`sidebar-item ${page === item.key ? 'active' : ''}`}
              onClick={() => setPage(item.key)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="dashboard-container">
          {page === 'dashboard' && (
            <DashboardPage
              services={services}
              upCount={upCount}
              downCount={downCount}
              avgResponse={avgResponse}
              lastUpdated={lastUpdated}
            />
          )}
          {page === 'response' && <ResponseTimePage services={services} />}
          {page === 'alerts' && <AlertsPage alerts={alerts} />}
          {page === 'profile' && <ProfilePage onLogout={handleLogout} />}
        </main>
      </div>
    </div>
  )
}

/* ============ APP ============ */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('watchtower_logged_in') === 'true')

  if (!isLoggedIn) return <LoginPage onLogin={() => setIsLoggedIn(true)} />

  return <Dashboard onLogout={() => setIsLoggedIn(false)} />
}

export default App