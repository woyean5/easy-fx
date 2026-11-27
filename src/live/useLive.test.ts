import { beforeEach, expect, test, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import * as storage from '../storage/storage'
import { newLiveAccount, openLive } from './account'

const q = vi.hoisted(() => ({ kraken: vi.fn(), coinbase: vi.fn(), candles: vi.fn() }))
vi.mock('./quotes', async orig => ({
  ...(await orig<typeof import('./quotes')>()),
  fetchKraken: q.kraken, fetchCoinbase: q.coinbase, fetchCandles: q.candles,
}))
import { useLive } from './useLive'

const now = () => Math.floor(Date.now() / 1000)

beforeEach(() => {
  localStorage.clear(); storage.__resetMemory(); vi.clearAllMocks()
  q.coinbase.mockResolvedValue({ USDJPY: 150, USDKRW: 1300 })
})

test('offline stop-out on reopen is not undone by the live effect', async () => {
  const t0 = now() - 3 * 3600
  storage.saveLive(openLive(newLiveAccount(t0), 'EURUSD', 'buy', 5_000_000, 30, { EURUSD: 1.1, USDKRW: 1300 }, t0))
  const crashAt = Math.floor((t0 + 3600) / 900) * 900
  q.candles.mockImplementation(async (pair: string) => pair === 'EURUSD' ? [{ t: crashAt, o: 1.1, h: 1.1, l: 1.0, c: 1.1 }] : [])
  q.kraken.mockResolvedValue({ EURUSD: 1.1, GBPUSD: 1.3, AUDUSD: 0.66 }) // 가격은 회복됨
  const { result } = renderHook(() => useLive())
  await waitFor(() => expect(result.current.notice).not.toBeNull())
  await act(() => new Promise(r => setTimeout(r, 50)))
  expect(result.current.acc.positions).toEqual({})
  expect(storage.getLive(now()).positions).toEqual({})
})

test('a dead Coinbase feed blocks USD/KRW even while Kraken works', async () => {
  q.coinbase.mockResolvedValueOnce({ USDJPY: 150, USDKRW: 1300 }).mockRejectedValue(new Error('down'))
  q.kraken.mockResolvedValue({ EURUSD: 1.1, GBPUSD: 1.3, AUDUSD: 0.66 })
  q.candles.mockResolvedValue([{ t: now() - 60, o: 1, h: 1, l: 1, c: 1 }])
  const { result } = renderHook(() => useLive())
  await waitFor(() => expect(result.current.mids.USDKRW).toBe(1300))
  vi.spyOn(Date, 'now').mockReturnValue((now() + 600) * 1000)
  await act(async () => { await result.current.refresh() })
  expect(result.current.info('USDKRW').down).toBe(true)
  expect(result.current.info('EURUSD').down).toBe(false)
  vi.restoreAllMocks()
})

test('returning from background after days re-checks the gap', async () => {
  q.kraken.mockResolvedValue({ EURUSD: 1.1, GBPUSD: 1.3, AUDUSD: 0.66 })
  q.candles.mockResolvedValue([{ t: now() - 60, o: 1.1, h: 1.1, l: 1.1, c: 1.1 }])
  const { result } = renderHook(() => useLive())
  await waitFor(() => expect(result.current.mids.EURUSD).toBe(1.1))
  await waitFor(() => expect(result.current.order('EURUSD', 'buy', 5_000_000, 30)).toBe(true))
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) })
  const later = now() + 3 * 86400
  vi.spyOn(Date, 'now').mockReturnValue(later * 1000)
  q.candles.mockImplementation(async (pair: string) => pair === 'EURUSD' ? [{ t: later - 86400, o: 1.1, h: 1.1, l: 1.0, c: 1.1 }] : [])
  hidden.mockReturnValue(false)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) })
  await waitFor(() => expect(result.current.notice?.offline).toBe(true))
  expect(result.current.acc.positions).toEqual({})
  vi.restoreAllMocks()
})

test('a response that lands while hidden does not move lastSeen forward', async () => {
  q.kraken.mockResolvedValue({ EURUSD: 1.1, GBPUSD: 1.3, AUDUSD: 0.66 })
  q.candles.mockResolvedValue([{ t: now() - 60, o: 1.1, h: 1.1, l: 1.1, c: 1.1 }])
  const { result } = renderHook(() => useLive())
  await waitFor(() => expect(result.current.order('EURUSD', 'buy', 5_000_000, 30)).toBe(true))
  const seen = result.current.acc.lastSeen
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) })
  vi.spyOn(Date, 'now').mockReturnValue((now() + 3 * 86400) * 1000)
  await act(async () => { await result.current.refresh() }) // 숨긴 뒤 도착한 응답
  expect(result.current.acc.lastSeen).toBe(seen)
  vi.restoreAllMocks()
})
