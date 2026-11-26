import { expect, test } from 'vitest'
import { closeLive, freeMargin, liveMarginLevel, newLiveAccount, openLive, replayOffline, stopOutAll, usedMargin } from './account'

const T = 1000

test('free margin limits new orders; same pair cannot be opened twice', () => {
  const mids = { EURUSD: 1.1, USDJPY: 150 }
  const a = openLive(newLiveAccount(T), 'EURUSD', 'buy', 2000, 3, mids, T)
  expect(usedMargin(a)).toBe(2000)
  expect(freeMargin(a, mids)).toBeLessThan(8000)
  expect(openLive(a, 'USDJPY', 'buy', 9000, 1, mids, T)).toBe(a)
  expect(openLive(a, 'EURUSD', 'sell', 100, 1, mids, T)).toBe(a)
  expect(openLive(a, 'USDJPY', 'buy', 0, 1, mids, T)).toBe(a)
  const b = openLive(a, 'USDJPY', 'sell', 1000, 2, mids, T)
  expect(Object.keys(b.positions).sort()).toEqual(['EURUSD', 'USDJPY'])
})

test('cross margin: one pair crashing stops out the whole account', () => {
  let a = newLiveAccount(T)
  a = openLive(a, 'USDJPY', 'buy', 4000, 30, { USDJPY: 150 }, T)
  a = openLive(a, 'EURUSD', 'buy', 4000, 30, { EURUSD: 1.1 }, T)
  expect(liveMarginLevel(a, { USDJPY: 145, EURUSD: 1.1 })!).toBeGreaterThan(50)
  expect(liveMarginLevel(a, { USDJPY: 142, EURUSD: 1.1 })!).toBeLessThan(50)
  const { acc, trades } = stopOutAll(a, { USDJPY: 142, EURUSD: 1.1 }, T + 1)
  expect(trades).toHaveLength(2)
  expect(trades.every(t => t.reason === 'stopout')).toBe(true)
  expect(acc.positions).toEqual({})
  expect(acc.balance).toBeCloseTo(10000 + trades[0].pnl + trades[1].pnl, 6)
})

test('closeLive realizes pnl and records the trade', () => {
  const a = openLive(newLiveAccount(T), 'USDKRW', 'buy', 1000, 1, { USDKRW: 1300 }, T)
  const { acc, trade } = closeLive(a, 'USDKRW', 1313, T + 60, 'manual')
  expect(acc.positions.USDKRW).toBeUndefined()
  expect(trade!.pnl).toBeGreaterThan(0)
  expect(trade!.closedAt).toBe(T + 60)
  expect(closeLive(acc, 'USDKRW', 1313, T, 'manual').trade).toBeNull()
})

test('offline candles that crossed the stop-out line liquidate at that time', () => {
  const a = openLive(newLiveAccount(50), 'EURUSD', 'buy', 5000, 30, { EURUSD: 1.1 }, 50)
  const candles = { EURUSD: [
    { t: 100, o: 1.1, h: 1.11, l: 1.09, c: 1.1 },
    { t: 200, o: 1.1, h: 1.1, l: 1.04, c: 1.06 },
    { t: 300, o: 1.06, h: 1.12, l: 1.06, c: 1.12 },
  ] }
  const r = replayOffline(a, candles, { EURUSD: 1.12 }, 400)
  expect(r.stoppedAt).toBe(200)
  expect(r.acc.positions).toEqual({})
  expect(r.trades[0].closedAt).toBe(200)
})

test('offline candles that stayed safe change nothing', () => {
  const a = openLive(newLiveAccount(50), 'EURUSD', 'sell', 5000, 30, { EURUSD: 1.1 }, 50)
  const r = replayOffline(a, { EURUSD: [{ t: 100, o: 1.1, h: 1.101, l: 1.09, c: 1.095 }] }, { EURUSD: 1.095 }, 400)
  expect(r.stoppedAt).toBeNull()
  expect(r.acc.positions.EURUSD).toBeDefined()
  expect(r.acc.lastSeen).toBe(400)
})
