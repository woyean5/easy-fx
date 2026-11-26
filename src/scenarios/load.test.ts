import { expect, test } from 'vitest'
import { validateSeries } from './load'
import { SCENARIOS } from './catalog'

test('accepts a well-formed series', () => {
  const s = { id: 'x', t: [1, 2], p: [150, 151] }
  expect(validateSeries(s)).toEqual(s)
})
test('rejects mismatched, empty or non-positive data', () => {
  expect(() => validateSeries({ id: 'x', t: [1], p: [1, 2] })).toThrow()
  expect(() => validateSeries({ id: 'x', t: [], p: [] })).toThrow()
  expect(() => validateSeries({ id: 'x', t: [1, 2], p: [1, 0] })).toThrow()
  expect(() => validateSeries(null)).toThrow()
})
test('catalog has the four scenarios', () => {
  expect(SCENARIOS.map(s => s.id)).toEqual(['yen-crash-2022', 'covid-dollar-2020', 'brexit-2016', 'carry-unwind-2024'])
})
