import { useEffect } from 'react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import { currentViewer, rememberViewer } from '@/lib/viewer'

export const Route = createFileRoute('/app')({
  // Runs on the server for the first load and before every client navigation.
  beforeLoad: async ({ location }) => {
    const viewer = await currentViewer()
    if (!viewer) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { viewer }
  },
  component: AppLayout,
})

function AppLayout() {
  const { viewer } = Route.useRouteContext()
  // Seed the client cache from the server-rendered context so the first click skips the check.
  useEffect(() => rememberViewer(viewer), [viewer])
  return (
    <AppShell viewer={viewer}>
      <Outlet />
    </AppShell>
  )
}
