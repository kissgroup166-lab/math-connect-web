import { useSyncExternalStore } from 'react'

const noop = () => () => {}

// False during the server render and hydration, true once running in the browser.
// For UI that is random per visit (shuffled games), so server and client HTML match.
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
