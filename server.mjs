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
  fetch: async (request) => {
    const tooLarge = () => new Response('Request too large', { status: 413 })
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return tooLarge()
    if (request.body) {
      // Read the body here so a visitor who leaves mid-upload (closed tab, lost signal) ends quietly
      // instead of TanStack Start logging "Error: aborted" for a response nobody is waiting for.
      let body
      try {
        body = await request.arrayBuffer()
      } catch (error) {
        if (error?.code === 'ECONNRESET' || request.signal.aborted) return new Response(null, { status: 499 })
        throw error
      }
      // Also catches chunked uploads that send no Content-Length.
      if (body.byteLength > MAX_BODY) return tooLarge()
      // srvx's request can't be cloned with `new Request(request, init)`, so copy its parts.
      request = new Request(request.url, { method: request.method, headers: request.headers, body, signal: request.signal })
    }
    return app.fetch(request)
  },
})
