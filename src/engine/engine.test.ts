import { describe, expect, test } from 'vitest'
import { close, open, quote, shouldStopOut, unrealizedPnl, marginLevel, equity } from './engine'
import type { Account } from './types'

const acc0: Account = { balance: 10000, position: null }

describe('engine', () => {
  test('quote applies half spread each side', () => {
    const q = quote('USDJPY', 150)
    expect(q.bid).toBeCloseTo(149.995, 6)
    expect(q.ask).toBeCloseTo(150.005, 6)
  })

  test('USDJPY buy 3x then +1 yen ≈ +$198', () => {
    const a = open(acc0, 'USDJPY', 'buy', 10000, 3, 150)
    expect(a.position!.units).toBe(30000)
    expect(unrealizedPnl('USDJPY', a.position!, 151)).toBeCloseTo((30000 * (150.995 - 150.005)) / 150.995, 2)
  })

  test('EURUSD sell profits when price falls', () => {
    const a = open(acc0, 'EURUSD', 'sell', 1000, 2, 1.1)
    expect(unrealizedPnl('EURUSD', a.position!, 1.09)).toBeGreaterThan(0)
  })

  test('second open is ignored (double tap)', () => {
    const a = open(acc0, 'USDJPY', 'buy', 1000, 1, 150)
    expect(open(a, 'USDJPY', 'buy', 1000, 1, 150)).toBe(a)
  })

  test('rejects margin <= 0 or > balance', () => {
    expect(open(acc0, 'USDJPY', 'buy', 0, 1, 150)).toBe(acc0)
    expect(open(acc0, 'USDJPY', 'buy', 10001, 1, 150)).toBe(acc0)
  })

  test('30x stop-out triggers below 50% margin level', () => {
    const a = open(acc0, 'USDJPY', 'buy', 10000, 30, 150)
    expect(shouldStopOut(a, 'USDJPY', 149)).toBe(false)
    expect(shouldStopOut(a, 'USDJPY', 147)).toBe(true)
  })

  test('margin level is null without a position, equity equals balance', () => {
    expect(marginLevel(acc0, 'USDJPY', 150)).toBeNull()
    expect(equity(acc0, 'USDJPY', 150)).toBe(10000)
    expect(shouldStopOut(acc0, 'USDJPY', 150)).toBe(false)
  })

  test('close realizes pnl into balance and clears position', () => {
    const a = close(open(acc0, 'GBPUSD', 'buy', 1000, 1, 1.3), 'GBPUSD', 1.3)
    expect(a.position).toBeNull()
    expect(a.balance).toBeLessThan(10000)
  })
})
