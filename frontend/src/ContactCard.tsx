import { useState } from 'react'
import type { Contact, ContactInput } from './types'

export function ContactCard({
  contact,
  onSave,
  onDelete,
}: {
  contact: Contact
  onSave: (changes: Partial<ContactInput>) => Promise<void>
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ContactInput>({
    name: contact.name,
    role: contact.role ?? '',
    notes: contact.notes ?? '',
    met_on: contact.met_on ?? '',
  })

  function set<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    await onSave({
      name: form.name,
      role: form.role || null,
      notes: form.notes || null,
      met_on: form.met_on || null,
    })
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="contact-card">
        <div className="contact-head">
          <div>
            <strong>{contact.name}</strong>
            {contact.role && <span className="contact-role"> · {contact.role}</span>}
          </div>
          <div className="contact-actions">
            {contact.met_on && <span className="contact-date">{contact.met_on}</span>}
            <button onClick={() => setEditing(true)}>Edit</button>
            <button className="danger-icon" onClick={onDelete} aria-label="Delete contact">
              🗑️
            </button>
          </div>
        </div>
        {contact.notes && <p className="contact-notes">{contact.notes}</p>}
      </div>
    )
  }

  return (
    <div className="contact-card contact-card-editing">
      <div className="form-row">
        <label>
          Name
          <input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label>
          Role
          <input value={form.role ?? ''} onChange={(e) => set('role', e.target.value)} />
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
        <button onClick={handleSave}>Save</button>
        <button onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div>
  )
}
