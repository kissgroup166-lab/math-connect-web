import { z } from 'zod'

// Mirrors Supabase's `lower_upper_letters_digits_symbols` requirement and its symbol set,
// so a password the form accepts is never rejected by Auth.
export const passwordRules = [
  {
    id: 'length',
    label: 'At least 10 characters',
    test: (p: string) => p.length >= 10,
  },
  {
    id: 'lower',
    label: 'A lowercase letter',
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: 'upper',
    label: 'An uppercase letter',
    test: (p: string) => /[A-Z]/.test(p),
  },
  { id: 'digit', label: 'A number', test: (p: string) => /\d/.test(p) },
  {
    id: 'symbol',
    label: 'A symbol, like ! @ # $',
    test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"|<>?,./`~\\]/.test(p),
  },
] as const

export const isStrongPassword = (p: string) => passwordRules.every((r) => r.test(p))

export const strongPassword = z
  .string()
  .max(72, 'Use 72 characters or fewer.')
  .refine(isStrongPassword, 'Your password doesn’t meet all the requirements.')
