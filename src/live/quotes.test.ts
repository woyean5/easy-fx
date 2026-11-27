import { expect, test } from 'vitest'
import { isStale, parseCoinbaseRates, parseKrakenOhlc, parseKrakenTicker } from './quotes'

const ticker = { error: [], result: {
  ZEURZUSD: { a: ['1.09764', '1', '1'], b: ['1.09760', '1', '1'] },
  ZGBPZUSD: { a: ['1.31081', '1', '1'], b: ['1.31075', '1', '1'] },
  AUDUSD: { a: ['0.66346', '1', '1'], b: ['0.66340', '1', '1'] },
  ZUSDZCAD: { a: ['1.42599', '1', '1'], b: ['1.42557', '1', '1'] },
  ZUSDZJPY: { a: ['161.799', '1', '1'], b: ['156.503', '1', '1'] },
} }

test('kraken ticker → mids for liquid pairs only (JPY ignored)', () => {
  const m = parseKrakenTicker(ticker)
  expect(m.EURUSD).toBeCloseTo(1.09762, 6)
  expect(m.GBPUSD).toBeCloseTo(1.31078, 6)
  expect(m.AUDUSD).toBeCloseTo(0.66343, 6)
  expect(m.USDCAD).toBeCloseTo(1.42578, 6)
  expect(m.USDJPY).toBeUndefined()
})

test('kraken error throws', () => {
  expect(() => parseKrakenTicker({ error: ['EGeneral:Too many requests'], result: {} })).toThrow()
})

test('coinbase rates → USDJPY and USDKRW', () => {
  const m = parseCoinbaseRates({ data: { currency: 'USD', rates: { JPY: '159.2446', KRW: '1343.68', EUR: '0.9' } } })
  expect(m).toEqual({ USDJPY: 159.2446, USDKRW: 1343.68 })
})

test('kraken ohlc → candles', () => {
  const c = parseKrakenOhlc({ error: [], result: { AUDUSD: [[1795051800, '0.66869', '0.66888', '0.66834', '0.66871', '0', '0', 40]], last: 1 } })
  expect(c).toEqual([{ t: 1795051800, o: 0.66869, h: 0.66888, l: 0.66834, c: 0.66871 }])
})

test('isStale after one hour', () => {
  expect(isStale(0, 3600)).toBe(false)
  expect(isStale(0, 3601)).toBe(true)
})

import { isFxWeekend } from './quotes'
test('fx weekend window', () => {
  expect(isFxWeekend(Date.UTC(2026, 10, 27, 21) / 1000)).toBe(false) // 금 21시
  expect(isFxWeekend(Date.UTC(2026, 10, 27, 22) / 1000)).toBe(true)  // 금 22시
  expect(isFxWeekend(Date.UTC(2026, 10, 28, 12) / 1000)).toBe(true)  // 토
  expect(isFxWeekend(Date.UTC(2026, 10, 29, 22) / 1000)).toBe(false) // 일 22시
})
