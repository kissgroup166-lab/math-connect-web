import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import type { AppUser } from '@/lib/submissions'
import { getSupabase, requireAdmin } from '@/lib/supabase.server'

export const listUsers = createServerFn({ method: 'GET' }).handler(async (): Promise<AppUser[]> => {
  const sb = getSupabase()
  await requireAdmin(sb)
  const [profiles, subs] = await Promise.all([
    sb.from('profiles').select('id, full_name, email, role, teacher_verified, created_at').order('created_at'),
    sb.from('submissions').select('owner_id'),
  ])
  if (profiles.error || subs.error) throw new Error('Could not load users.')
  const counts = new Map<string, number>()
  for (const s of subs.data) counts.set(s.owner_id, (counts.get(s.owner_id) ?? 0) + 1)
  return profiles.data.map((p) => ({
    id: p.id,
    name: p.full_name || p.email.split('@')[0],
    email: p.email,
    role: p.role,
    joined: p.created_at,
    uploads: counts.get(p.id) ?? 0,
    canPublish: p.teacher_verified,
  }))
})

// Admin can move users between student and teacher. The database rejects any change to or from admin.
export const updateUser = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid(), role: z.enum(['student', 'teacher']), canPublish: z.boolean() }))
  .handler(async ({ data }) => {
    const sb = getSupabase()
    const admin = await requireAdmin(sb)
    if (data.id === admin.id) throw new Error('The admin account can’t be changed here.')
    const { error } = await sb
      .from('profiles')
      .update({ role: data.role, teacher_verified: data.role === 'teacher' && data.canPublish })
      .eq('id', data.id)
    if (error) throw new Error('Could not update this user.')
  })
