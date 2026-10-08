import type { Application, ApplicationInput, Contact, ContactInput, User } from './types'

// Same origin as the page: Vite proxies /api in dev, FastAPI serves the build in production.
const API_BASE = '/api'

// Fired when the session is missing or expired; App listens and shows the login page.
export const UNAUTHORIZED_EVENT = 'jt:unauthorized'

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Request failed (${res.status}): ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  auth: {
    me: () => fetch(`${API_BASE}/auth/me`).then((r) => handle<User>(r)),

    login: (email: string, password: string) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then((r) => handle<User>(r)),

    logout: () => fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).then((r) => handle<void>(r)),
  },

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
