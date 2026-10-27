import { createFileRoute } from '@tanstack/react-router'
import type { EmailOtpType } from '@supabase/supabase-js'

import { getSupabaseForRequest } from '@/lib/supabase.server'

const otpTypes: EmailOtpType[] = ['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change']

// Landing point for email links (signup confirmation, password reset).
// Verifies the link and sets the session cookie, then redirects. `token_hash` links (from the email
// templates in the Supabase dashboard) work on any device; `code` links only in the browser that asked.
export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const tokenHash = url.searchParams.get('token_hash')
        const type = url.searchParams.get('type') as EmailOtpType | null
        const nextParam = url.searchParams.get('next') ?? '/app'
        // Only same-site paths, so the link can't bounce users to another domain.
        const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/app'
        const headers = new Headers()
        let target = next
        if (tokenHash && type && otpTypes.includes(type)) {
          const { error } = await getSupabaseForRequest(request, headers).auth.verifyOtp({ token_hash: tokenHash, type })
          if (error) target = '/login?error=link'
        } else if (code) {
          const { error } = await getSupabaseForRequest(request, headers).auth.exchangeCodeForSession(code)
          if (error) target = '/login?error=link'
        } else {
          target = '/login?error=link'
        }
        headers.set('Location', target)
        return new Response(null, { status: 302, headers })
      },
    },
  },
})
