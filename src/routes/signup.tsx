import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { GraduationCap, School } from 'lucide-react'
import { toast } from 'sonner'

import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/signup')({
  head: () => ({ meta: [{ title: 'Create account · MathConnect' }] }),
  component: Signup,
})

// Admin is never self-selectable; it is assigned to the site owner only.
const roles = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'teacher', label: 'Teacher', icon: School },
] as const

function Signup() {
  const navigate = useNavigate()
  const [role, setRole] = useState<'student' | 'teacher'>('student')
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
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          toast.success(`Preview ${role} account created`)
          navigate({ to: '/app' })
        }}
      >
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
          <Input id="name" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required placeholder="you@school.edu" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
