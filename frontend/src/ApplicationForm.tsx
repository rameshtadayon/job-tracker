import { useState } from 'react'
import { STATUSES, type ApplicationInput } from './types'

const EMPTY: ApplicationInput = {
  company: '',
  role: '',
  status: 'saved',
  job_url: '',
  location: '',
  salary: '',
  applied_date: '',
  notes: '',
  company_notes: '',
  prep_notes: '',
}

export function ApplicationForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: ApplicationInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ApplicationInput>(EMPTY)

  function set<K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) return
    onSubmit({
      ...form,
      job_url: form.job_url || null,
      location: form.location || null,
      salary: form.salary || null,
      applied_date: form.applied_date || null,
      notes: form.notes || null,
      company_notes: form.company_notes || null,
      prep_notes: form.prep_notes || null,
    })
    setForm(EMPTY)
  }

  return (
    <form className="app-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Company
          <input
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            required
          />
        </label>
        <label>
          Role
          <input value={form.role} onChange={(e) => set('role', e.target.value)} required />
        </label>
        <label>
          Status
          <select value={form.status} onChange={(e) => set('status', e.target.value as any)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Job URL
          <input value={form.job_url ?? ''} onChange={(e) => set('job_url', e.target.value)} />
        </label>
        <label>
          Location
          <input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
        </label>
        <label>
          Salary
          <input value={form.salary ?? ''} onChange={(e) => set('salary', e.target.value)} />
        </label>
        <label>
          Applied date
          <input
            type="date"
            value={form.applied_date ?? ''}
            onChange={(e) => set('applied_date', e.target.value)}
          />
        </label>
      </div>
      <label className="notes-label">
        Notes
        <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </label>
      <div className="form-actions">
        <button type="submit">Add application</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
