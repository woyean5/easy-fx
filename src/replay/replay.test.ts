import { expect, test } from 'vitest'
import { indexAt, ROUND_SECONDS } from './replay'

test('indexAt maps elapsed time onto the series', () => {
  expect(ROUND_SECONDS).toBe(300)
  expect(indexAt(0, 2000)).toBe(0)
  expect(indexAt(150_000, 2001)).toBe(1000)
  expect(indexAt(300_000, 2000)).toBe(1999)
  expect(indexAt(999_999, 2000)).toBe(1999)
})
