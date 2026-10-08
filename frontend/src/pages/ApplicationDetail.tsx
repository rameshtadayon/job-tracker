import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { ContactCard } from '../ContactCard'
import { ContactForm } from '../ContactForm'
import { STATUS_META } from '../statusMeta'
import { STATUSES, type Application, type ApplicationStatus, type ContactInput } from '../types'
import '../App.css'

export default function ApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const applicationId = Number(id)

  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)

  const [companyNotes, setCompanyNotes] = useState('')
  const [prepNotes, setPrepNotes] = useState('')

  useEffect(() => {
    load()
  }, [applicationId])

  function load() {
    setLoading(true)
    api
      .get(applicationId)
      .then((a) => {
        setApp(a)
        setCompanyNotes(a.company_notes ?? '')
        setPrepNotes(a.prep_notes ?? '')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  async function handleStatusChange(status: ApplicationStatus) {
    if (!app) return
    try {
      const updated = await api.update(app.id, { status })
      setApp(updated)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function saveCompanyNotes() {
    if (!app) return
    try {
      const updated = await api.update(app.id, { company_notes: companyNotes || null })
      setApp(updated)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function savePrepNotes() {
    if (!app) return
    try {
      const updated = await api.update(app.id, { prep_notes: prepNotes || null })
      setApp(updated)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleAddContact(input: ContactInput) {
    if (!app) return
    try {
      await api.contacts.create(app.id, input)
      setShowContactForm(false)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleUpdateContact(contactId: number, changes: Partial<ContactInput>) {
    try {
      await api.contacts.update(contactId, changes)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleDeleteContact(contactId: number) {
    if (!confirm('Delete this contact?')) return
    try {
      await api.contacts.remove(contactId)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleDeleteApplication() {
    if (!app) return
    if (!confirm(`Delete application for ${app.role} at ${app.company}?`)) return
    try {
      await api.remove(app.id)
      navigate('/')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (loading) return <div className="page"><p className="empty">Loading…</p></div>
  if (error && !app) return <div className="page"><p className="empty">{error}</p></div>
  if (!app) return null

  const meta = STATUS_META[app.status]

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back to all applications
      </Link>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <header className="detail-header" style={{ borderTopColor: meta.color }}>
        <div>
          <h1>
            {app.job_url ? (
              <a href={app.job_url} target="_blank" rel="noreferrer">
                {app.company}
              </a>
            ) : (
              app.company
            )}
          </h1>
          <p className="role">{app.role}</p>
          <div className="card-meta">
            {app.location && <span>📍 {app.location}</span>}
            {app.salary && <span>💰 {app.salary}</span>}
            {app.applied_date && <span>🗓️ Applied {app.applied_date}</span>}
          </div>
        </div>
        <div className="detail-header-actions">
          <select
            className="status-select"
            value={app.status}
            style={{ background: meta.color }}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].emoji} {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <button className="danger-icon" onClick={handleDeleteApplication} aria-label="Delete application">
            🗑️
          </button>
        </div>
      </header>

      <div className="detail-grid">
        <section className="detail-panel">
          <h2>🏢 Company notes</h2>
          <textarea
            className="panel-textarea"
            value={companyNotes}
            onChange={(e) => setCompanyNotes(e.target.value)}
            onBlur={saveCompanyNotes}
            placeholder="Culture, size, funding, what they do, anything general..."
          />
        </section>

        <section className="detail-panel">
          <h2>🎯 Interview prep</h2>
          <textarea
            className="panel-textarea"
            value={prepNotes}
            onChange={(e) => setPrepNotes(e.target.value)}
            onBlur={savePrepNotes}
            placeholder="Topics to review, questions to ask, things to remember..."
          />
        </section>
      </div>

      <section className="contacts-section">
        <div className="section-head">
          <h2>🧑‍🤝‍🧑 People you've talked to</h2>
          <button onClick={() => setShowContactForm((v) => !v)}>
            {showContactForm ? 'Close' : '+ Add contact'}
          </button>
        </div>

        {showContactForm && (
          <ContactForm onSubmit={handleAddContact} onCancel={() => setShowContactForm(false)} />
        )}

        {app.contacts.length === 0 ? (
          <p className="empty">No contacts logged yet — add the first person you spoke with.</p>
        ) : (
          <div className="contact-list">
            {app.contacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onSave={(changes) => handleUpdateContact(c.id, changes)}
                onDelete={() => handleDeleteContact(c.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
