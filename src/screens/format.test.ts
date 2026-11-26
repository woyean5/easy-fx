import { expect, test } from 'vitest'
import { fmtPct, fmtUsd, trendClass } from './types'

test('money and percent formatting near zero', () => {
  expect(fmtUsd(-0.13)).toBe('-$0.13')
  expect(fmtUsd(-0.001)).toBe('$0.00')
  expect(fmtUsd(10240)).toBe('$10,240')
  expect(fmtUsd(-6143.4)).toBe('-$6,143')
  expect(fmtPct(-0.001)).toBe('0.00%')
  expect(fmtPct(12.434)).toBe('+12.43%')
  expect(trendClass(-0.001)).toBe('flat')
  expect(trendClass(-1)).toBe('down')
})
