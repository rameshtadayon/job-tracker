export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn'

export const STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
]

export const CLOSED_STATUSES: ApplicationStatus[] = ['rejected', 'withdrawn']

export interface Contact {
  id: number
  application_id: number
  name: string
  role: string | null
  notes: string | null
  met_on: string | null
  created_at: string
}

export type ContactInput = Omit<Contact, 'id' | 'application_id' | 'created_at'>

export interface Application {
  id: number
  company: string
  role: string
  status: ApplicationStatus
  job_url: string | null
  location: string | null
  salary: string | null
  applied_date: string | null
  notes: string | null
  company_notes: string | null
  prep_notes: string | null
  created_at: string
  updated_at: string
  contacts: Contact[]
}

export type ApplicationInput = Omit<
  Application,
  'id' | 'created_at' | 'updated_at' | 'contacts'
>

export interface User {
  id: number
  email: string
}
