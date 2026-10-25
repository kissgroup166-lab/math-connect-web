import { useState } from 'react'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { GraduationCap, MailCheck, School } from 'lucide-react'
import { toast } from 'sonner'

import { AuthLayout } from '@/components/auth-layout'
import { PasswordChecklist, PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getViewer, signUp } from '@/lib/auth.functions'
import { isStrongPassword } from '@/lib/password'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    if (await getViewer()) throw redirect({ to: '/app' })
  },
  head: () => ({ meta: [{ title: 'Create account · MathConnect' }] }),
  component: Signup,
})

// Admin is never self-selectable; it is assigned to the site owner only.
const roles = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'teacher', label: 'Teacher', icon: School },
] as const

function Signup() {
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    if (!isStrongPassword(password)) {
      setError('Your password doesn’t meet all the requirements below.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await signUp({ data: { name: String(form.get('name')), email, password, role } })
      if (res.needsConfirmation) {
        setConfirmEmail(email)
        return
      }
      await router.invalidate()
      toast.success('Account created')
      await router.navigate({ to: '/app' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="You need an account to upload and share PDFs."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {confirmEmail ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
          <MailCheck className="size-10 text-success" />
          <p className="text-sm">
            We sent a confirmation link to <strong>{confirmEmail}</strong>. Open it to finish signing up.
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-medium">I am a…</legend>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={role === r.id}
                  onClick={() => setRole(r.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-medium transition-colors motion-reduce:transition-none',
                    role === r.id ? 'border-primary bg-secondary text-primary' : 'hover:bg-muted',
                  )}
                >
                  <r.icon className="size-5" />
                  {r.label}
                </button>
              ))}
            </div>
            {role === 'teacher' && (
              <p className="mt-2 text-xs text-muted-foreground">Teacher permissions are granted after the admin verifies your account.</p>
            )}
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" autoComplete="name" required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@school.edu" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
