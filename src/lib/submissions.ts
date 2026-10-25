// Shared submission types and display copy, used by both server functions and pages.
import type { RelevanceBand } from '@/lib/relevance'

export type Role = 'student' | 'teacher' | 'admin'
export type SubmissionStatus = 'queued' | 'pending' | 'review' | 'approved' | 'rejected' | 'flagged'

export interface Submission {
  id: string
  title: string
  fileName: string
  sizeKb: number
  lessonId: string
  ownerName: string
  ownerRole: Role
  uploadedAt: string
  score: number | null
  band: RelevanceBand | null
  explanation: string
  status: SubmissionStatus
  flags: string[]
  adminFeedback?: string
}

export interface Viewer {
  id: string
  name: string
  email: string
  role: Role
  teacherVerified: boolean
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  joined: string
  uploads: number
  canPublish: boolean
}

// Keep in sync with the latest size migration in supabase/migrations.
export const MAX_UPLOAD_MB = 2
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

export const inReview = (s: Submission) => ['queued', 'pending', 'review', 'flagged'].includes(s.status)

export const statusCopy: Record<SubmissionStatus, { label: string; tone: string }> = {
  queued: { label: 'Checking relevance', tone: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending approval', tone: 'bg-accent text-accent-foreground' },
  review: { label: 'Manual review', tone: 'bg-secondary text-secondary-foreground' },
  flagged: { label: 'Flagged', tone: 'bg-warning/20 text-accent-foreground' },
  approved: { label: 'Approved', tone: 'bg-success/15 text-success' },
  rejected: { label: 'Rejected', tone: 'bg-destructive/10 text-destructive' },
}

/** Same-origin URL that streams a submission's PDF after an RLS check. */
export const fileUrl = (id: string, download = false) => `/api/files/${id}${download ? '?download=1' : ''}`
