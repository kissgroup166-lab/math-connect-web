import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { MailCheck } from 'lucide-react'

import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/forgot-password')({
  head: () => ({ meta: [{ title: 'Reset password · MathConnect' }] }),
  component: ForgotPassword,
})

function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null)
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
            If an account exists for <strong>{sentTo}</strong>, a reset link is on its way.
          </p>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const email = new FormData(e.currentTarget).get('email')
            setSentTo(String(email))
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
