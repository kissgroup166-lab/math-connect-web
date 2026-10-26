import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

// Every /app/admin page is admin-only. Server functions check the role again on their own.
export const Route = createFileRoute('/app/admin')({
  beforeLoad: ({ context }) => {
    if (context.viewer.role !== 'admin') throw redirect({ to: '/app' })
  },
  component: Outlet,
})
