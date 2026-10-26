import { useEffect } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/components/error-pages'
import { currentContent, rememberContent } from '@/lib/content'

import '../styles.css'

const siteName = 'MathConnect — Learn for free'
const siteDescription =
  'Learn trigonometric identities, exponential and logarithmic functions — with lessons, quizzes, games, and reviewed study materials.'

export const Route = createRootRoute({
  // Course content for every page (useContent). Cached on the server and in the browser.
  beforeLoad: async () => ({ content: await currentContent() }),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: siteName,
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
  component: Root,
  notFoundComponent: NotFoundPage,
})

function Root() {
  const { content } = Route.useRouteContext()
  // Seed the browser cache from the server render so the first navigation skips a fetch.
  useEffect(() => rememberContent(content), [content])
  return <Outlet />
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
