import { expect, test } from 'vitest'
import { fmtPct, fmtWon, trendClass } from './types'

test('won formatting', () => {
  expect(fmtWon(10_000_000)).toBe('10,000,000원')
  expect(fmtWon(-1234.6)).toBe('-1,235원')
  expect(fmtWon(-0.4)).toBe('0원')
  expect(fmtWon(0)).toBe('0원')
})

test('percent formatting near zero', () => {
  expect(fmtPct(-0.001)).toBe('0.00%')
  expect(fmtPct(12.434)).toBe('+12.43%')
  expect(trendClass(-0.001)).toBe('flat')
  expect(trendClass(-1)).toBe('down')
})
