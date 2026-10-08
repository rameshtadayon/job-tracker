import type { Application, ApplicationInput, Contact, ContactInput } from './types'

const API_BASE = 'http://localhost:8000/api'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Request failed (${res.status}): ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  list: () => fetch(`${API_BASE}/applications`).then((r) => handle<Application[]>(r)),

  get: (id: number) => fetch(`${API_BASE}/applications/${id}`).then((r) => handle<Application>(r)),

  create: (input: ApplicationInput) =>
    fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then((r) => handle<Application>(r)),

  update: (id: number, changes: Partial<ApplicationInput>) =>
    fetch(`${API_BASE}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    }).then((r) => handle<Application>(r)),

  remove: (id: number) =>
    fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' }).then((r) => handle<void>(r)),

  contacts: {
    create: (applicationId: number, input: ContactInput) =>
      fetch(`${API_BASE}/applications/${applicationId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }).then((r) => handle<Contact>(r)),

    update: (contactId: number, changes: Partial<ContactInput>) =>
      fetch(`${API_BASE}/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      }).then((r) => handle<Contact>(r)),

    remove: (contactId: number) =>
      fetch(`${API_BASE}/contacts/${contactId}`, { method: 'DELETE' }).then((r) => handle<void>(r)),
  },
}
