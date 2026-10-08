import type { ApplicationStatus } from './types'

export const STATUS_META: Record<ApplicationStatus, { label: string; emoji: string; color: string }> = {
  saved: { label: 'Saved', emoji: '📌', color: '#8b8fa3' },
  applied: { label: 'Applied', emoji: '📨', color: '#4c8bf5' },
  interviewing: { label: 'Interviewing', emoji: '🎤', color: '#b968e8' },
  offer: { label: 'Offer', emoji: '🎉', color: '#2fb88a' },
  rejected: { label: 'Rejected', emoji: '💔', color: '#f05c5c' },
  withdrawn: { label: 'Withdrawn', emoji: '🚪', color: '#c08a4a' },
}
