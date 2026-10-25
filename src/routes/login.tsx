import { useState } from 'react'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { AuthLayout } from '@/components/auth-layout'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getViewer, signIn } from '@/lib/auth.functions'

// Only same-site paths, so a crafted link can't send users elsewhere after login.
const safePath = (p: unknown) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? p : undefined)

export const Route = createFileRoute('/login')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; error?: string } => ({
    redirect: safePath(s.redirect),
    error: typeof s.error === 'string' ? s.error : undefined,
  }),
  beforeLoad: async () => {
    if (await getViewer()) throw redirect({ to: '/app' })
  },
  head: () => ({ meta: [{ title: 'Log in · MathConnect' }] }),
  component: Login,
})

function Login() {
  const router = useRouter()
  const search = Route.useSearch()
  const [error, setError] = useState<string | null>(search.error === 'link' ? 'That link has expired or was already used. Log in or request a new one.' : null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await signIn({ data: { email: String(form.get('email')), password: String(form.get('password')) } })
      await router.invalidate()
      toast.success('Welcome back!')
      await router.navigate({ href: search.redirect ?? '/app' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to track progress and upload materials."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@school.edu" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
