import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Log in · MathConnect' }] }),
  component: Login,
})

function Login() {
  const navigate = useNavigate()
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
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          toast('Signed in to the preview account')
          navigate({ to: '/app' })
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required placeholder="you@school.edu" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" required minLength={8} />
        </div>
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  )
}
