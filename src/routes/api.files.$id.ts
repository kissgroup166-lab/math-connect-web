import { createFileRoute } from '@tanstack/react-router'

import { getSupabaseForRequest } from '@/lib/supabase.server'

// Streams a submission's PDF. RLS decides access: owners and the admin see
// their files, and everyone signed in sees approved ones.
export const Route = createFileRoute('/api/files/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const headers = new Headers()
        const sb = getSupabaseForRequest(request, headers)
        const { data: row } = await sb.from('submissions').select('file_path, file_name').eq('id', params.id).maybeSingle()
        if (!row) return new Response('Not found', { status: 404, headers })

        const { data: file, error } = await sb.storage.from('materials').download(row.file_path)
        if (error || !file) return new Response('Not found', { status: 404, headers })

        const download = new URL(request.url).searchParams.has('download')
        const name = String(row.file_name).replace(/[^\w.\- ]+/g, '_')
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${name}"`)
        headers.set('Cache-Control', 'private, no-store')
        headers.set('X-Content-Type-Options', 'nosniff')
        return new Response(file, { headers })
      },
    },
  },
})
