import { getViewer } from '@/lib/auth.functions'
import type { Viewer } from '@/lib/submissions'

// Dashboard navigations reuse the signed-in viewer briefly instead of a server round trip
// per click. Server functions still check the session themselves; this only feeds the shell
// and route guards. Call forgetViewer() whenever the session or profile changes.
const TTL_MS = 60_000
let cached: { viewer: Viewer; at: number } | null = null

export function rememberViewer(viewer: Viewer) {
  if (typeof window !== 'undefined') cached = { viewer, at: Date.now() }
}

export function forgetViewer() {
  cached = null
}

export async function currentViewer() {
  // Module state is shared across requests on the server, so only cache in the browser.
  if (typeof window === 'undefined') return getViewer()
  if (cached && Date.now() - cached.at < TTL_MS) return cached.viewer
  const viewer = await getViewer()
  if (viewer) rememberViewer(viewer)
  else forgetViewer()
  return viewer
}
