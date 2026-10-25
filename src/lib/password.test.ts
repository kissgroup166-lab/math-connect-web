import { describe, expect, it } from 'vitest'

import { isStrongPassword, passwordRules, strongPassword } from '@/lib/password'

const failing = (p: string) => passwordRules.filter((r) => !r.test(p)).map((r) => r.id)

describe('password rules', () => {
  it('accepts a password that meets every rule', () => {
    expect(isStrongPassword('Tangent#2024')).toBe(true)
    expect(strongPassword.safeParse('Tangent#2024').success).toBe(true)
  })

  it('reports each missing requirement', () => {
    expect(failing('')).toEqual(['length', 'lower', 'upper', 'digit', 'symbol'])
    expect(failing('password123')).toEqual(['upper', 'symbol'])
    expect(failing('Short1!')).toEqual(['length'])
  })

  it('rejects anything over 72 characters', () => {
    expect(strongPassword.safeParse(`Aa1!${'x'.repeat(69)}`).success).toBe(false)
  })
})
