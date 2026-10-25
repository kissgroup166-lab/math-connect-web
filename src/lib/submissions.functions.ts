import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getLesson } from '@/data/lessons'
import { checkPdf, isPdf } from '@/lib/pdf-check.server'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, type Submission } from '@/lib/submissions'
import { getSupabase, requireAdmin, requireViewer } from '@/lib/supabase.server'

interface SubmissionRow {
  id: string
  title: string
  file_name: string
  size_bytes: number
  lesson_id: string
  owner_name: string
  owner_role: Submission['ownerRole']
  created_at: string
  score: number | null
  band: Submission['band']
  explanation: string
  status: Submission['status']
  flags: string[]
  admin_feedback: string | null
}

const columns = 'id, title, file_name, size_bytes, lesson_id, owner_name, owner_role, created_at, score, band, explanation, status, flags, admin_feedback'

const toSubmission = (r: SubmissionRow): Submission => ({
  id: r.id,
  title: r.title,
  fileName: r.file_name,
  sizeKb: Math.round(r.size_bytes / 1024),
  lessonId: r.lesson_id,
  ownerName: r.owner_name,
  ownerRole: r.owner_role,
  uploadedAt: r.created_at,
  score: r.score,
  band: r.band,
  explanation: r.explanation,
  status: r.status,
  flags: r.flags,
  adminFeedback: r.admin_feedback ?? undefined,
})

function rows(res: { data: SubmissionRow[] | null; error: unknown }) {
  if (res.error) throw new Error('Could not load submissions.')
  return (res.data ?? []).map(toSubmission)
}

export const listMySubmissions = createServerFn({ method: 'GET' }).handler(async () => {
  const sb = getSupabase()
  const viewer = await requireViewer(sb)
  return rows(await sb.from('submissions').select(columns).eq('owner_id', viewer.id).order('created_at', { ascending: false }))
})

export const listApproved = createServerFn({ method: 'GET' })
  .validator(z.object({ lessonId: z.string().optional() }))
  .handler(async ({ data }) => {
    const sb = getSupabase()
    await requireViewer(sb)
    let q = sb.from('submissions').select(columns).eq('status', 'approved')
    if (data.lessonId) q = q.eq('lesson_id', data.lessonId)
    return rows(await q.order('created_at', { ascending: false }))
  })

export const listAllSubmissions = createServerFn({ method: 'GET' }).handler(async () => {
  const sb = getSupabase()
  await requireAdmin(sb)
  return rows(await sb.from('submissions').select(columns).order('created_at', { ascending: false }))
})

export const uploadSubmission = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('Expected form data.')
    const file = data.get('file')
    const lessonId = String(data.get('lessonId') ?? '')
    const title = String(data.get('title') ?? '').trim()
    if (!(file instanceof File)) throw new Error('Choose a PDF to upload.')
    if (file.size === 0) throw new Error('This file is empty.')
    if (file.size > MAX_UPLOAD_BYTES) throw new Error(`The limit is ${MAX_UPLOAD_MB} MB.`)
    const lesson = getLesson(lessonId)
    if (!lesson) throw new Error('Choose the lesson this PDF covers.')
    return { file, lesson, title: (title || file.name).slice(0, 200) }
  })
  .handler(async ({ data: { file, lesson, title } }) => {
    const sb = getSupabase()
    const viewer = await requireViewer(sb)
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!isPdf(bytes)) throw new Error('Only PDF files can be uploaded.')

    // pdf.js may detach the buffer it reads, so score a copy.
    const check = await checkPdf(bytes.slice(), lesson)
    const id = crypto.randomUUID()
    const path = `${viewer.id}/${id}.pdf`

    const up = await sb.storage.from('materials').upload(path, bytes, { contentType: 'application/pdf' })
    if (up.error) throw new Error('Could not store the file. Try again.')

    const { error } = await sb.from('submissions').insert({
      id,
      owner_id: viewer.id,
      owner_name: viewer.name,
      owner_role: viewer.role,
      lesson_id: lesson.id,
      title,
      file_name: file.name.slice(0, 200),
      file_path: path,
      size_bytes: file.size,
      status: check.status,
      score: check.score,
      band: check.band,
      explanation: check.explanation,
      matched_keywords: check.matchedKeywords,
      flags: check.flags,
    })
    if (error) {
      await sb.storage.from('materials').remove([path])
      throw new Error('Could not save the submission. Try again.')
    }
    return { status: check.status, score: check.score }
  })

export const reviewSubmission = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid(), approve: z.boolean(), feedback: z.string().trim().max(1000) }))
  .handler(async ({ data }) => {
    const sb = getSupabase()
    const admin = await requireAdmin(sb)
    const { error } = await sb
      .from('submissions')
      .update({
        status: data.approve ? 'approved' : 'rejected',
        admin_feedback: data.feedback || null,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', data.id)
    if (error) throw new Error('Could not save the decision.')
  })
