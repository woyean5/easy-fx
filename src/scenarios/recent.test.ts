import { expect, test } from 'vitest'
import { candlesToSeries, summarize, parseAvailable } from './recent'

const H = 3600
const mk = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => ({ t: 1_000_000 + i * H, o: f(i), h: f(i), l: f(i), c: f(i) }))

test('candles → series, only the last 30 days', () => {
  const cs = mk(800, i => 1 + i / 10000)
  const s = candlesToSeries('recent-eurusd', cs)
  expect(s.id).toBe('recent-eurusd')
  expect(s.t[s.t.length - 1]).toBe(cs[799].t)
  expect(s.t[0]).toBeGreaterThanOrEqual(cs[799].t - 30 * 86400)
  expect(s.p).toHaveLength(s.t.length)
})

test('summary sentences come from the data', () => {
  // 1.1000 → 1.0890 (−1%), 하루 동안 가장 큰 움직임
  const cs = mk(72, i => (i < 24 ? 1.1 : i < 48 ? 1.08 : 1.089))
  const lines = summarize('EURUSD', candlesToSeries('x', cs))
  expect(lines[0]).toContain('1.10000')
  expect(lines[0]).toContain('1.08900')
  expect(lines[0]).toContain('-1.00%')
  expect(lines[1]).toContain('최고 1.10000')
  expect(lines[1]).toContain('최저 1.08000')
  expect(lines[2]).toMatch(/가장 크게 움직인 날은 .+\(-1\.82%\)/)
})

test('available historic scenarios come from index.json', () => {
  expect(parseAvailable({ ids: ['brexit-2016'] })).toEqual(new Set(['brexit-2016']))
  expect(parseAvailable(null)).toEqual(new Set())
  expect(parseAvailable({ ids: 'x' })).toEqual(new Set())
})
