// Production Node server for Docker: static assets from dist/client, everything else through TanStack Start.
// Build first with `TARGET=node vite build` (the Dockerfile does this).
import { serve } from 'srvx'
import { staticMiddleware } from 'srvx/static'

import app from './dist/server/server.js'

// Uploads are capped at 2 MB; allow a little extra for the multipart envelope.
// A Content-Length check rather than srvx's limitRequestBody, whose wrapper breaks request.formData().
// The upload handler still checks the real file size after parsing.
const MAX_BODY = 3 * 1024 * 1024

serve({
  port: Number(process.env.PORT ?? 3000),
  hostname: process.env.HOST ?? '0.0.0.0',
  middleware: [staticMiddleware({ dir: 'dist/client' })],
  fetch: (request) => {
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) {
      return new Response('Request too large', { status: 413 })
    }
    return app.fetch(request)
  },
})
