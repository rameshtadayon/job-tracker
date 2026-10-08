import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ApplicationForm } from '../ApplicationForm'
import { STATUS_META } from '../statusMeta'
import {
  CLOSED_STATUSES,
  STATUSES,
  type Application,
  type ApplicationInput,
  type ApplicationStatus,
} from '../types'
import '../App.css'

type Filter = ApplicationStatus | 'all' | 'active'

export default function ApplicationsList() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<Filter>('active')

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    setLoading(true)
    api
      .list()
      .then(setApplications)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  async function handleCreate(input: ApplicationInput) {
    try {
      await api.create(input)
      setShowForm(false)
      refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleStatusChange(app: Application, status: ApplicationStatus) {
    try {
      await api.update(app.id, { status })
      refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleDelete(app: Application) {
    if (!confirm(`Delete application for ${app.role} at ${app.company}?`)) return
    try {
      await api.remove(app.id)
      refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const visible = useMemo(() => {
    if (filter === 'all') return applications
    if (filter === 'active') return applications.filter((a) => !CLOSED_STATUSES.includes(a.status))
    return applications.filter((a) => a.status === filter)
  }, [applications, filter])

  return (
    <div className="page">
      <header className="page-header">
        <div className="title-block">
          <h1>🚀 Job Hunt HQ</h1>
          <p className="tagline">Keep tabs on every application, interview, and offer.</p>
        </div>
        <button className="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Close' : '+ Add application'}
        </button>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showForm && (
        <ApplicationForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      <div className="filters">
        <button
          className={`pill ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          ✨ Active · {applications.filter((a) => !CLOSED_STATUSES.includes(a.status)).length}
        </button>
        <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All · {applications.length}
        </button>
        {STATUSES.map((s) => {
          const meta = STATUS_META[s]
          const count = applications.filter((a) => a.status === s).length
          return (
            <button
              key={s}
              className={`pill ${filter === s ? 'active' : ''}`}
              style={filter === s ? { background: meta.color, borderColor: meta.color, color: '#fff' } : undefined}
              onClick={() => setFilter(s)}
            >
              {meta.emoji} {meta.label} · {count}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <p className="empty-emoji">🗂️</p>
          <p>No applications here yet. Add your first one above!</p>
        </div>
      ) : (
        <div className="cards">
          {visible.map((app) => {
            const meta = STATUS_META[app.status]
            return (
              <article
                key={app.id}
                className="card card-clickable"
                style={{ borderTopColor: meta.color }}
                onClick={() => navigate(`/applications/${app.id}`)}
              >
                <div className="card-head">
                  <div>
                    <h3>{app.company}</h3>
                    <p className="role">{app.role}</p>
                  </div>
                  <button
                    className="danger-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(app)
                    }}
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </div>

                <div className="card-meta">
                  {app.location && <span>📍 {app.location}</span>}
                  {app.salary && <span>💰 {app.salary}</span>}
                  {app.applied_date && <span>🗓️ {app.applied_date}</span>}
                  {app.contacts.length > 0 && <span>🧑‍🤝‍🧑 {app.contacts.length}</span>}
                </div>

                {app.notes && <p className="card-notes">{app.notes}</p>}

                <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="status-select"
                    value={app.status}
                    style={{ background: meta.color }}
                    onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].emoji} {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
