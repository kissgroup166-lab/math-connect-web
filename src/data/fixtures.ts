// Stubbed data for the product preview. Everything here is replaced by
// Supabase queries in later milestones (see PLAN.md) — keep stubs in this file.
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
  ownerRole: Exclude<Role, 'admin'>
  uploadedAt: string
  score: number | null
  band: RelevanceBand | null
  explanation: string
  status: SubmissionStatus
  flags: string[]
  adminFeedback?: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  joined: string
  uploads: number
  canPublish?: boolean
}

export const currentUser: AppUser = {
  id: 'u-1',
  name: 'Maya Santos',
  email: 'maya.santos@example.edu',
  role: 'student',
  joined: '2026-08-30',
  uploads: 3,
}

export const users: AppUser[] = [
  currentUser,
  { id: 'u-2', name: 'Mr. Daniel Reyes', email: 'd.reyes@example.edu', role: 'teacher', joined: '2026-08-12', uploads: 6, canPublish: true },
  { id: 'u-3', name: 'Aiko Tanaka', email: 'aiko.t@example.edu', role: 'student', joined: '2026-09-04', uploads: 1 },
  { id: 'u-4', name: 'Ms. Priya Nair', email: 'p.nair@example.edu', role: 'teacher', joined: '2026-09-10', uploads: 2, canPublish: false },
  { id: 'u-5', name: 'Jonah Brooks', email: 'jonah.b@example.edu', role: 'student', joined: '2026-10-02', uploads: 0 },
  { id: 'u-0', name: 'Site Owner', email: 'owner@example.edu', role: 'admin', joined: '2026-08-01', uploads: 0 },
]

export const submissions: Submission[] = [
  {
    id: 's-101',
    title: 'Double-angle cheat sheet',
    fileName: 'double-angle-cheatsheet.pdf',
    sizeKb: 412,
    lessonId: 'double-half-angle',
    ownerName: 'Maya Santos',
    ownerRole: 'student',
    uploadedAt: '2026-10-19T14:22:00Z',
    score: 91,
    band: 'relevant',
    explanation: 'Matched 8 of 9 lesson keywords and 3 of 4 key formulas, and the lesson title appears in the text.',
    status: 'pending',
    flags: [],
  },
  {
    id: 's-102',
    title: 'Log laws practice set',
    fileName: 'log-laws-practice.pdf',
    sizeKb: 1290,
    lessonId: 'laws-of-logarithms',
    ownerName: 'Maya Santos',
    ownerRole: 'student',
    uploadedAt: '2026-10-12T09:05:00Z',
    score: 86,
    band: 'relevant',
    explanation: 'Matched 7 of 9 lesson keywords and all 3 key formulas.',
    status: 'approved',
    flags: [],
    adminFeedback: 'Clear and well-organized — thanks for sharing!',
  },
  {
    id: 's-103',
    title: 'Chemistry lab notes',
    fileName: 'lab-notes-week6.pdf',
    sizeKb: 2210,
    lessonId: 'growth-decay-e',
    ownerName: 'Maya Santos',
    ownerRole: 'student',
    uploadedAt: '2026-10-08T17:41:00Z',
    score: 22,
    band: 'unrelated',
    explanation: 'Matched 2 of 11 lesson keywords ("decay", "rate") and none of the key formulas.',
    status: 'rejected',
    flags: [],
    adminFeedback: 'This looks like a chemistry worksheet. Please upload materials about exponential growth and decay.',
  },
  {
    id: 's-201',
    title: 'Unit circle & Pythagorean proofs',
    fileName: 'pythagorean-proofs.pdf',
    sizeKb: 860,
    lessonId: 'pythagorean-identities',
    ownerName: 'Mr. Daniel Reyes',
    ownerRole: 'teacher',
    uploadedAt: '2026-10-20T08:10:00Z',
    score: 64,
    band: 'review',
    explanation: 'Matched 6 of 12 lesson keywords and 1 of 3 key formulas.',
    status: 'review',
    flags: [],
  },
  {
    id: 's-202',
    title: 'Scanned worksheet — exponent equations',
    fileName: 'scan_0041.pdf',
    sizeKb: 6400,
    lessonId: 'solving-exponential-equations',
    ownerName: 'Aiko Tanaka',
    ownerRole: 'student',
    uploadedAt: '2026-10-20T11:47:00Z',
    score: null,
    band: null,
    explanation: 'Very little readable text was found. The file may be scanned or image-only.',
    status: 'flagged',
    flags: ['Scanned / image-only'],
  },
  {
    id: 's-203',
    title: 'Change of base worked examples',
    fileName: 'change-of-base.pdf',
    sizeKb: 540,
    lessonId: 'change-of-base-log-equations',
    ownerName: 'Ms. Priya Nair',
    ownerRole: 'teacher',
    uploadedAt: '2026-10-18T15:30:00Z',
    score: 94,
    band: 'relevant',
    explanation: 'Matched 9 of 9 lesson keywords and 3 of 3 key formulas.',
    status: 'approved',
    flags: [],
  },
  {
    id: 's-204',
    title: 'Sum & difference identities notes',
    fileName: 'sum-diff-notes.pdf',
    sizeKb: 720,
    lessonId: 'sum-difference-identities',
    ownerName: 'Mr. Daniel Reyes',
    ownerRole: 'teacher',
    uploadedAt: '2026-10-15T10:00:00Z',
    score: 88,
    band: 'relevant',
    explanation: 'Matched 10 of 12 lesson keywords and 2 of 3 key formulas.',
    status: 'approved',
    flags: [],
  },
  {
    id: 's-205',
    title: 'Password-protected exam review',
    fileName: 'exam-review-locked.pdf',
    sizeKb: 980,
    lessonId: 'exponential-basics',
    ownerName: 'Jonah Brooks',
    ownerRole: 'student',
    uploadedAt: '2026-10-21T05:12:00Z',
    score: null,
    band: null,
    explanation: 'The PDF is encrypted, so its text could not be read.',
    status: 'flagged',
    flags: ['Encrypted'],
  },
]

export const mySubmissions = submissions.filter((s) => s.ownerName === currentUser.name)
export const approvedMaterials = submissions.filter((s) => s.status === 'approved')

export const statusCopy: Record<SubmissionStatus, { label: string; tone: string }> = {
  queued: { label: 'Checking relevance', tone: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending approval', tone: 'bg-accent text-accent-foreground' },
  review: { label: 'Manual review', tone: 'bg-secondary text-secondary-foreground' },
  flagged: { label: 'Flagged', tone: 'bg-warning/20 text-accent-foreground' },
  approved: { label: 'Approved', tone: 'bg-success/15 text-success' },
  rejected: { label: 'Rejected', tone: 'bg-destructive/10 text-destructive' },
}

// Per-lesson completion for the preview user (0–100).
export const lessonProgress: Record<string, number> = {
  'pythagorean-identities': 100,
  'sum-difference-identities': 60,
  'double-half-angle': 20,
  'exponential-basics': 100,
  'growth-decay-e': 40,
  'logarithm-definition': 80,
  'laws-of-logarithms': 30,
}

export const streakDays = 6
