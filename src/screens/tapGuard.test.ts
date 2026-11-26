import { expect, test } from 'vitest'
import { isTooSoon, TAP_GUARD_MS } from './tapGuard'

test('a second tap within the guard window is ignored', () => {
  expect(TAP_GUARD_MS).toBe(500)
  expect(isTooSoon(1000, 1200)).toBe(true)
  expect(isTooSoon(1000, 1500)).toBe(false)
  expect(isTooSoon(null, 1000)).toBe(false)
})
