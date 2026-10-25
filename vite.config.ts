import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

// TARGET=node builds a plain Node server (used by the Dockerfile) instead of Netlify Functions.
const forNode = process.env.TARGET === 'node'

const config = defineConfig(({ mode }) => {
  // Server functions read process.env at runtime. Load .env for `vite dev`; real env vars win.
  Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ''), ...process.env })
  return {
    resolve: { tsconfigPaths: true },
    // No edge functions here; their Deno-based dev emulation also crashes on some machines.
    plugins: [tailwindcss(), ...(forNode ? [] : [netlify({ dev: { edgeFunctions: { enabled: false } } })]), tanstackStart(), viteReact()],
  }
})

export default config
