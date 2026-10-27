import { createServerFn } from '@tanstack/react-start'
import { getRequestUrl } from '@tanstack/react-start/server'
import { z } from 'zod'

import { strongPassword as password } from '@/lib/password'
import type { Viewer } from '@/lib/submissions'
import { getSupabase, loadViewer, requireViewer } from '@/lib/supabase.server'

const siteUrl = () => process.env.SITE_URL || getRequestUrl().origin

const email = z.string().trim().toLowerCase().email()

// Supabase's raw messages are terse ("email rate limit exceeded"); turn the common ones into guidance.
function authMessage(error: { code?: string; message: string }) {
  switch (error.code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists.'
    case 'over_email_send_rate_limit':
      return 'Too many sign-up emails were sent recently. Please wait a few minutes and try again.'
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.'
    case 'weak_password':
      return 'That password is too weak. Make sure it meets every requirement.'
    case 'same_password':
      return 'Choose a password you haven’t used before.'
    case 'email_address_invalid':
      return 'That email address can’t be used. Try a different one.'
    default:
      return error.message
  }
}

export const getViewer = createServerFn({ method: 'GET' }).handler(() => loadViewer(getSupabase()))

export const signIn = createServerFn({ method: 'POST' })
  .validator(z.object({ email, password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sb = getSupabase()
    const { data: auth, error } = await sb.auth.signInWithPassword(data)
    if (error) throw new Error(error.code === 'email_not_confirmed' ? 'Confirm your email first, then log in.' : 'Email or password is incorrect.')
    // The login page sends the admin to the admin overview instead of the student home.
    const { data: profile } = await sb.from('profiles').select('role').eq('id', auth.user.id).single()
    return { role: (profile?.role ?? 'student') as Viewer['role'] }
  })

// Role is only a hint: the database trigger allows student or teacher, never admin.
export const signUp = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string().trim().min(1).max(100), email, password, role: z.enum(['student', 'teacher']) }))
  .handler(async ({ data }) => {
    const { data: res, error } = await getSupabase().auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name, role: data.role }, emailRedirectTo: `${siteUrl()}/auth/callback` },
    })
    if (error) throw new Error(authMessage(error))
    // With email confirmation on, Supabase hides taken emails behind a fake success: a user with no identities.
    if (res.user && res.user.identities?.length === 0) throw new Error('An account with this email already exists. Log in instead.')
    return { needsConfirmation: !res.session }
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  await getSupabase().auth.signOut()
})

// Always succeeds so the form doesn't reveal which emails have accounts.
export const requestPasswordReset = createServerFn({ method: 'POST' })
  .validator(z.object({ email }))
  .handler(async ({ data }) => {
    await getSupabase().auth.resetPasswordForEmail(data.email, { redirectTo: `${siteUrl()}/auth/callback?next=/reset-password` })
  })

export const updatePassword = createServerFn({ method: 'POST' })
  .validator(z.object({ password }))
  .handler(async ({ data }) => {
    const sb = getSupabase()
    await requireViewer(sb)
    const { error } = await sb.auth.updateUser({ password: data.password })
    if (error) throw new Error(authMessage(error))
  })

export const updateProfile = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }) => {
    const sb = getSupabase()
    const viewer = await requireViewer(sb)
    const { error } = await sb.from('profiles').update({ full_name: data.name }).eq('id', viewer.id)
    if (error) throw new Error('Could not save your profile.')
  })
