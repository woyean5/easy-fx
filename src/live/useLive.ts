import { useCallback, useEffect, useRef, useState } from 'react'
import type { Side } from '../engine/types'
import { addLiveTrades, getLive, getTicks, pushTick, resetLive, saveLive } from '../storage/storage'
import { closeLive, liveShouldStopOut, openLive, replayOffline, stopOutAll, type ClosedTrade, type LiveAccount } from './account'
import {
  fetchCandles, fetchCoinbase, fetchKraken, hasHistory, isFxWeekend, isStale, KRAKEN_PAIRS, LIVE_PAIRS,
  type Candle, type LivePair, type Mids,
} from './quotes'

const nowSec = () => Math.floor(Date.now() / 1000)
const KRAKEN_MS = 3000
const COINBASE_MS = 60000
const CANDLE_MS = 5 * 60000

export interface PairInfo {
  mid?: number
  /** 24시간 전 가격 */
  prev?: number
  spark: number[]
  stale: boolean
}

export interface StopOutNotice { at: number; offline: boolean; trades: ClosedTrade[] }

export function useLive() {
  const [acc, setAcc] = useState<LiveAccount>(() => getLive(nowSec()))
  const [mids, setMids] = useState<Mids>({})
  const [candles, setCandles] = useState<Partial<Record<LivePair, Candle[]>>>({})
  const [offline, setOffline] = useState(false)
  const [notice, setNotice] = useState<StopOutNotice | null>(null)
  const [tickVersion, setTickVersion] = useState(0)
  const replayed = useRef(false)
  const accRef = useRef(acc)
  accRef.current = acc

  const commit = useCallback((next: LiveAccount, trades: ClosedTrade[] = []) => {
    saveLive(next)
    addLiveTrades(trades)
    setAcc(next)
  }, [])

  // ── 시세 폴링 (화면이 보일 때만) ──
  useEffect(() => {
    let alive = true
    const timers: number[] = []
    const kraken = async () => {
      try {
        const m = await fetchKraken()
        if (alive) { setMids(x => ({ ...x, ...m })); setOffline(false) }
      } catch { if (alive) setOffline(true) }
    }
    const coinbase = async () => {
      try {
        const m = await fetchCoinbase()
        if (!alive) return
        const t = nowSec()
        for (const [p, v] of Object.entries(m)) pushTick(p as LivePair, t, v!)
        setMids(x => ({ ...x, ...m }))
        setTickVersion(v => v + 1)
        setOffline(false)
      } catch { if (alive) setOffline(true) }
    }
    const loadCandles = async () => {
      const gap = nowSec() - accRef.current.lastSeen
      const interval = gap > 6 * 86400 ? 240 : 15
      const res = await Promise.allSettled(KRAKEN_PAIRS.map(p => fetchCandles(p, interval)))
      if (!alive) return
      const next: Partial<Record<LivePair, Candle[]>> = {}
      res.forEach((r, i) => { if (r.status === 'fulfilled') next[KRAKEN_PAIRS[i]] = r.value })
      setCandles(c => ({ ...c, ...next }))
    }
    const start = () => {
      kraken(); coinbase(); loadCandles()
      timers.push(window.setInterval(kraken, KRAKEN_MS), window.setInterval(coinbase, COINBASE_MS), window.setInterval(loadCandles, CANDLE_MS))
    }
    const stop = () => { timers.forEach(clearInterval); timers.length = 0 }
    const onVis = () => { if (document.hidden) stop(); else { stop(); start() } }
    start()
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; stop(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // ── 앱을 닫아둔 동안의 강제청산 확인 (처음 한 번) ──
  useEffect(() => {
    if (replayed.current) return
    const haveQuotes = LIVE_PAIRS.every(p => mids[p] !== undefined || !acc.positions[p])
    const needCandles = KRAKEN_PAIRS.some(p => acc.positions[p])
    if (!haveQuotes || (needCandles && KRAKEN_PAIRS.some(p => acc.positions[p] && !candles[p]))) return
    replayed.current = true
    const r = replayOffline(acc, candles, mids, nowSec())
    commit(r.acc, r.trades)
    if (r.stoppedAt !== null) setNotice({ at: r.stoppedAt, offline: true, trades: r.trades })
  }, [acc, mids, candles, commit])

  // ── 실시간 강제청산 확인 + 마지막 확인 시각 저장 ──
  useEffect(() => {
    if (!replayed.current) return
    if (liveShouldStopOut(acc, mids)) {
      const r = stopOutAll(acc, mids, nowSec())
      commit({ ...r.acc, lastSeen: nowSec() }, r.trades)
      setNotice({ at: nowSec(), offline: false, trades: r.trades })
    } else if (!offline && nowSec() - acc.lastSeen > 30) {
      commit({ ...acc, lastSeen: nowSec() })
    }
  }, [acc, mids, offline, commit])

  const info = (pair: LivePair): PairInfo => {
    const now = nowSec()
    if (hasHistory(pair)) {
      const cs = (candles[pair] ?? []).filter(c => c.t >= now - 86400)
      const last = candles[pair]?.[candles[pair]!.length - 1]
      return {
        mid: mids[pair],
        prev: cs[0]?.o,
        spark: cs.map(c => c.c),
        stale: last ? isStale(last.t, now) : false,
      }
    }
    void tickVersion
    const ticks = getTicks(pair).filter(t => t.t >= now - 86400)
    return {
      mid: mids[pair],
      prev: ticks.length > 1 ? ticks[0].p : undefined,
      spark: ticks.map(t => t.p),
      stale: isFxWeekend(now),
    }
  }

  const order = (pair: LivePair, side: Side, margin: number, leverage: number): boolean => {
    if (info(pair).stale || offline) return false
    const next = openLive(acc, pair, side, margin, leverage, mids, nowSec())
    if (next === acc) return false
    commit(next)
    return true
  }

  const closePos = (pair: LivePair) => {
    const mid = mids[pair]
    if (mid === undefined) return
    const r = closeLive(acc, pair, mid, nowSec(), 'manual')
    commit(r.acc, r.trade ? [r.trade] : [])
  }

  const reset = () => { resetLive(nowSec()); setAcc(getLive(nowSec())) }

  return { acc, mids, offline, notice, dismissNotice: () => setNotice(null), info, order, closePos, reset }
}

export type LiveApi = ReturnType<typeof useLive>
