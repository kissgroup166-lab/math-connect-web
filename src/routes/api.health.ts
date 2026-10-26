import { createFileRoute } from '@tanstack/react-router'

// Liveness check for hosts like Render. It doesn't touch Supabase, so a slow database
// never makes the host restart a healthy server.
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => new Response('ok', { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } }),
    },
  },
})
