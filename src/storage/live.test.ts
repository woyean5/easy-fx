import { beforeEach, expect, test } from 'vitest'
import * as s from './storage'
import { newLiveAccount } from '../live/account'

beforeEach(() => { localStorage.clear(); s.__resetMemory() })

test('live account round-trips; resetLive clears account and history but keeps scenario records', () => {
  const a = { ...newLiveAccount(5), balance: 1234 }
  s.saveLive(a)
  expect(s.getLive(9).balance).toBe(1234)
  s.addLiveTrades([{ pair: 'EURUSD', side: 'buy', leverage: 3, margin: 100, pnl: 5, openedAt: 1, closedAt: 2, reason: 'manual' }])
  s.addRecord({ scenarioId: 'brexit-2016', leverage: 1, returnPct: 1, stoppedOut: false, at: 1 })
  s.resetLive(10)
  expect(s.getLive(11).balance).toBe(10000)
  expect(s.getLive(11).lastSeen).toBe(10)
  expect(s.getLiveHistory()).toEqual([])
  expect(s.getRecords()).toHaveLength(1)
})

test('getLive returns a fresh account when nothing is stored', () => {
  expect(s.getLive(42)).toEqual(newLiveAccount(42))
})

test('ticks are capped at 2000 per pair', () => {
  for (let i = 0; i < 2005; i++) s.pushTick('USDKRW', i, 1300 + i)
  const t = s.getTicks('USDKRW')
  expect(t).toHaveLength(2000)
  expect(t[0].t).toBe(5)
})
