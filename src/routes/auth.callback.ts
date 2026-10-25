import { createFileRoute } from '@tanstack/react-router'

import { getSupabaseForRequest } from '@/lib/supabase.server'

// Landing point for email links (signup confirmation, password reset).
// Exchanges the one-time code for a session cookie, then redirects.
export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const nextParam = url.searchParams.get('next') ?? '/app'
        // Only same-site paths, so the link can't bounce users to another domain.
        const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/app'
        const headers = new Headers()
        let target = next
        if (code) {
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
