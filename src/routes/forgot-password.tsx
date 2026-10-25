import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { MailCheck } from 'lucide-react'

import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/lib/auth.functions'

export const Route = createFileRoute('/forgot-password')({
  head: () => ({ meta: [{ title: 'Reset password · MathConnect' }] }),
  component: ForgotPassword,
})

function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email'))
    setBusy(true)
    setError(null)
    try {
      await requestPasswordReset({ data: { email } })
      setSentTo(email)
    } catch {
      setError('Enter a valid email address.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We’ll email you a link to choose a new one."
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      {sentTo ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
          <MailCheck className="size-10 text-success" />
          <p className="text-sm">
            If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. Open it in this browser.
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
