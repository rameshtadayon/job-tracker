import { useState } from 'react'
import type { ContactInput } from './types'

const EMPTY: ContactInput = { name: '', role: '', notes: '', met_on: '' }

export function ContactForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: ContactInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ContactInput>(EMPTY)

  function set<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      ...form,
      role: form.role || null,
      notes: form.notes || null,
      met_on: form.met_on || null,
    })
    setForm(EMPTY)
  }

  return (
    <form className="app-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Name
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <label>
          Role
          <input
            value={form.role ?? ''}
            onChange={(e) => set('role', e.target.value)}
            placeholder="Recruiter, VP of Eng, ..."
          />
        </label>
        <label>
          Met on
          <input type="date" value={form.met_on ?? ''} onChange={(e) => set('met_on', e.target.value)} />
        </label>
      </div>
      <label className="notes-label">
        Notes
        <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </label>
      <div className="form-actions">
        <button type="submit">Add contact</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
