// Server-only Supabase access. The browser never talks to Supabase directly:
// every query runs here under the signed-in user's session, so RLS applies.
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'

import type { Viewer } from '@/lib/submissions'

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set')
  return { url, key }
}

/** Client for server functions; reads and writes the session cookies of the current request. */
export function getSupabase() {
  const { url, key } = config()
  return createServerClient(url, key, {
    cookies: {
      getAll: () => Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => setCookie(name, value, options)),
    },
  })
}

/** Client for server route handlers that build their own Response. Set-Cookie lands in `headers`. */
export function getSupabaseForRequest(request: Request, headers: Headers) {
  const { url, key } = config()
  return createServerClient(url, key, {
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get('cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' })),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => headers.append('Set-Cookie', serializeCookieHeader(name, value, options))),
    },
  })
}

export async function loadViewer(sb: ReturnType<typeof getSupabase>): Promise<Viewer | null> {
  // getClaims verifies the session JWT against the project's cached signing keys, so it
  // skips the Auth round trip getUser makes. The profile query below still runs under RLS.
  const { data: auth } = await sb.auth.getClaims()
  const userId = auth?.claims.sub
  if (!userId) return null
  const { data } = await sb.from('profiles').select('full_name, email, role, teacher_verified').eq('id', userId).single()
  if (!data) return null
  return {
    id: userId,
    name: data.full_name || data.email.split('@')[0],
    email: data.email,
    role: data.role,
    teacherVerified: data.teacher_verified,
  }
}

export async function requireViewer(sb: ReturnType<typeof getSupabase>) {
  const viewer = await loadViewer(sb)
  if (!viewer) throw new Error('Please log in again.')
  return viewer
}

export async function requireAdmin(sb: ReturnType<typeof getSupabase>) {
  const viewer = await requireViewer(sb)
  if (viewer.role !== 'admin') throw new Error('Only the admin can do that.')
  return viewer
}
