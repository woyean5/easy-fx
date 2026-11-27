import { expect, test } from 'vitest'
import { START_BALANCE as START } from '../engine/engine'
import { closeLive, freeMargin, liveMarginLevel, newLiveAccount, openLive, replayOffline, stopOutAll, usedMargin } from './account'

const T = 1000

test('free margin limits new orders; same pair cannot be opened twice', () => {
  const mids = { EURUSD: 1.1, USDJPY: 150, USDKRW: 1000 }
  const a = openLive(newLiveAccount(T), 'EURUSD', 'buy', 2000000, 3, mids, T)
  expect(usedMargin(a)).toBe(2_000_000)
  expect(freeMargin(a, mids)).toBeLessThan(8_000_000)
  expect(openLive(a, 'USDJPY', 'buy', 9000000, 1, mids, T)).toBe(a)
  expect(openLive(a, 'EURUSD', 'sell', 100000, 1, mids, T)).toBe(a)
  expect(openLive(a, 'USDJPY', 'buy', 0, 1, mids, T)).toBe(a)
  const b = openLive(a, 'USDJPY', 'sell', 1000000, 2, mids, T)
  expect(Object.keys(b.positions).sort()).toEqual(['EURUSD', 'USDJPY'])
})

test('cross margin: one pair crashing stops out the whole account', () => {
  let a = newLiveAccount(T)
  a = openLive(a, 'USDJPY', 'buy', 4000000, 30, { USDJPY: 150, USDKRW: 1000 }, T)
  a = openLive(a, 'EURUSD', 'buy', 4000000, 30, { EURUSD: 1.1, USDKRW: 1000 }, T)
  expect(liveMarginLevel(a, { USDJPY: 145, EURUSD: 1.1, USDKRW: 1000 })!).toBeGreaterThan(50)
  expect(liveMarginLevel(a, { USDJPY: 142, EURUSD: 1.1, USDKRW: 1000 })!).toBeLessThan(50)
  const { acc, trades } = stopOutAll(a, { USDJPY: 142, EURUSD: 1.1, USDKRW: 1000 }, T + 1)
  expect(trades).toHaveLength(2)
  expect(trades.every(t => t.reason === 'stopout')).toBe(true)
  expect(acc.positions).toEqual({})
  expect(acc.balance).toBeCloseTo(START + trades[0].pnl + trades[1].pnl, 6)
})

test('closeLive realizes pnl and records the trade', () => {
  const a = openLive(newLiveAccount(T), 'USDKRW', 'buy', 1000000, 1, { USDKRW: 1300 }, T)
  const { acc, trade } = closeLive(a, 'USDKRW', 1313, 1313, T + 60, 'manual')
  expect(acc.positions.USDKRW).toBeUndefined()
  expect(trade!.pnl).toBeGreaterThan(0)
  expect(trade!.closedAt).toBe(T + 60)
  expect(closeLive(acc, 'USDKRW', 1313, 1313, T, 'manual').trade).toBeNull()
})

test('offline candles that crossed the stop-out line liquidate at that time', () => {
  const a = openLive(newLiveAccount(50), 'EURUSD', 'buy', 5000000, 30, { EURUSD: 1.1, USDKRW: 1000 }, 50)
  const candles = { EURUSD: [
    { t: 100, o: 1.1, h: 1.11, l: 1.09, c: 1.1 },
    { t: 200, o: 1.1, h: 1.1, l: 1.04, c: 1.06 },
    { t: 300, o: 1.06, h: 1.12, l: 1.06, c: 1.12 },
  ] }
  const r = replayOffline(a, candles, { EURUSD: 1.12, USDKRW: 1000 }, 400)
  expect(r.stoppedAt).toBe(200)
  expect(r.acc.positions).toEqual({})
  expect(r.trades[0].closedAt).toBe(200)
})

test('offline candles that stayed safe change nothing', () => {
  const a = openLive(newLiveAccount(50), 'EURUSD', 'sell', 5000000, 30, { EURUSD: 1.1, USDKRW: 1000 }, 50)
  const r = replayOffline(a, { EURUSD: [{ t: 100, o: 1.1, h: 1.101, l: 1.09, c: 1.095 }] }, { EURUSD: 1.095, USDKRW: 1000 }, 400)
  expect(r.stoppedAt).toBeNull()
  expect(r.acc.positions.EURUSD).toBeDefined()
  expect(r.acc.lastSeen).toBe(400)
})

test('4h candles: the candle containing lastSeen is still checked', () => {
  const a = openLive(newLiveAccount(0), 'EURUSD', 'buy', 5000000, 30, { EURUSD: 1.1, USDKRW: 1000 }, 0)
  const acc = { ...a, lastSeen: 15500 } // 4시간봉 14400 안에 있음
  const r = replayOffline(acc, { EURUSD: [{ t: 14400, o: 1.1, h: 1.1, l: 1.04, c: 1.1 }] }, { EURUSD: 1.1, USDKRW: 1000 }, 99999, 14400)
  expect(r.stoppedAt).toBe(14400)
})

test('candles that started before the position was opened are ignored', () => {
  const a = openLive(newLiveAccount(1000), 'EURUSD', 'buy', 5000000, 30, { EURUSD: 1.1, USDKRW: 1000 }, 1000)
  const r = replayOffline(a, { EURUSD: [{ t: 900, o: 1.04, h: 1.1, l: 1.04, c: 1.1 }] }, { EURUSD: 1.1, USDKRW: 1000 }, 5000)
  expect(r.stoppedAt).toBeNull()
  expect(r.acc.positions.EURUSD).toBeDefined()
})

test('won account: no USD/KRW quote means no new orders', () => {
  const a = newLiveAccount(T)
  expect(openLive(a, 'EURUSD', 'buy', 1_000_000, 1, { EURUSD: 1.1 }, T)).toBe(a)
})

test('won account: pnl is shown in won at the current USD/KRW', () => {
  const a = openLive(newLiveAccount(T), 'EURUSD', 'buy', 1_350_000, 1, { EURUSD: 1.1, USDKRW: 1350 }, T)
  const pnl = (1000 / 1.10004) * (1.10996 - 1.10004) * 1350
  expect(liveMarginLevel(a, { EURUSD: 1.11, USDKRW: 1350 })).toBeCloseTo(((10_000_000 + pnl) / 1_350_000) * 100, 4)
})
