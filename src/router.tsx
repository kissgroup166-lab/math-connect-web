import { createRouter } from '@tanstack/react-router'
import { RouteErrorPage } from '@/components/error-pages'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    defaultErrorComponent: RouteErrorPage,
    scrollRestoration: true,
    // Start loading a page when its link is hovered or focused, and reuse that result on click.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
