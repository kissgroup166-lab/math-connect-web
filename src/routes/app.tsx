import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import { getViewer } from '@/lib/auth.functions'

export const Route = createFileRoute('/app')({
  // Runs on the server for the first load and before every client navigation.
  beforeLoad: async ({ location }) => {
    const viewer = await getViewer()
    if (!viewer) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { viewer }
  },
  component: AppLayout,
})

function AppLayout() {
  const { viewer } = Route.useRouteContext()
  return (
    <AppShell viewer={viewer}>
      <Outlet />
    </AppShell>
  )
}
