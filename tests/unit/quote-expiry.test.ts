import { it, expect } from 'vitest'
import { quoteIsCurrent, type Quote } from '../../src/domain/commerce'
it('expired quotes are rejected on the provider clock, including the exact boundary', () => {
  const q = { expiresAt: 1000 } as Quote
  expect(quoteIsCurrent(q, 999)).toBe(true)
  expect(quoteIsCurrent(q, 1000)).toBe(false)
  expect(quoteIsCurrent(q, 1001)).toBe(false)
  expect(quoteIsCurrent(undefined, 900)).toBe(false)
})
