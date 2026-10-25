import { useState } from 'react'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { AuthLayout } from '@/components/auth-layout'
import { PasswordChecklist, PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getViewer, updatePassword } from '@/lib/auth.functions'
import { isStrongPassword } from '@/lib/password'

// Reached from the reset email via /auth/callback, which signs the user in first.
export const Route = createFileRoute('/reset-password')({
  beforeLoad: async () => {
    if (!(await getViewer())) throw redirect({ to: '/login', search: { error: 'link' } })
  },
  head: () => ({ meta: [{ title: 'Choose a new password · MathConnect' }] }),
  component: ResetPassword,
})

function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (!isStrongPassword(password)) {
      setError('Your password doesn’t meet all the requirements below.')
      return
    }
    if (password !== String(form.get('confirm'))) {
      setError('The passwords don’t match.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updatePassword({ data: { password } })
      toast.success('Password updated')
      await router.navigate({ to: '/app' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something strong that you haven’t used before."
      footer={
        <Link to="/app" className="font-semibold text-primary hover:underline">
          Skip for now
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-rules"
          />
          <PasswordChecklist id="password-rules" password={password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required maxLength={72} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
