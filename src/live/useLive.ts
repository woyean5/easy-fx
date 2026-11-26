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
/** 시세 출처가 이 시간(초) 넘게 응답하지 않으면 그 출처의 통화는 주문을 막는다 */
const DOWN_AFTER = { kraken: 10, coinbase: 150 }
/** 이보다 오래 백그라운드에 있다가 돌아오면 닫아둔 동안의 강제청산을 다시 확인한다 */
const RECHECK_AFTER_HIDDEN = 60

type Feed = 'kraken' | 'coinbase'
const feedOf = (p: LivePair): Feed => (hasHistory(p) ? 'kraken' : 'coinbase')

export interface PairInfo {
  mid?: number
  /** 24시간 전 가격 */
  prev?: number
  spark: number[]
  /** 시장 휴장 */
  stale: boolean
  /** 시세 출처 연결 끊김 */
  down: boolean
}

export interface StopOutNotice { at: number; offline: boolean; trades: ClosedTrade[] }

export function useLive() {
  const [acc, setAcc] = useState<LiveAccount>(() => getLive(nowSec()))
  const [mids, setMids] = useState<Mids>({})
  const [candles, setCandles] = useState<Partial<Record<LivePair, Candle[]>>>({})
  const [lastOk, setLastOk] = useState<Record<Feed, number | null>>({ kraken: null, coinbase: null })
  const [notice, setNotice] = useState<StopOutNotice | null>(null)
  const [tickVersion, setTickVersion] = useState(0)
  const startedAt = useRef(nowSec())
  const replayed = useRef(false)
  const candleInterval = useRef(900)
  const accRef = useRef(acc)
  accRef.current = acc
  const pollers = useRef<{ kraken: () => Promise<void>; coinbase: () => Promise<void> } | null>(null)

  const commit = useCallback((next: LiveAccount, trades: ClosedTrade[] = []) => {
    saveLive(next)
    addLiveTrades(trades)
    accRef.current = next
    setAcc(next)
  }, [])

  // ── 시세 폴링 (화면이 보일 때만) ──
  useEffect(() => {
    let alive = true
    const timers: number[] = []
    let hiddenAt: number | null = null
    const ok = (f: Feed) => setLastOk(x => ({ ...x, [f]: nowSec() }))
    const kraken = async () => {
      try {
        const m = await fetchKraken()
        if (alive) { setMids(x => ({ ...x, ...m })); ok('kraken') }
      } catch { /* 마지막 시세 유지, lastOk로 끊김 판단 */ }
    }
    const coinbase = async () => {
      try {
        const m = await fetchCoinbase()
        if (!alive) return
        const t = nowSec()
        for (const [p, v] of Object.entries(m)) pushTick(p as LivePair, t, v!)
        setMids(x => ({ ...x, ...m }))
        setTickVersion(v => v + 1)
        ok('coinbase')
      } catch { /* 위와 같음 */ }
    }
    pollers.current = { kraken, coinbase }
    const loadCandles = async () => {
      const gap = nowSec() - accRef.current.lastSeen
      const minutes = gap > 6 * 86400 ? 240 : 15
      const res = await Promise.allSettled(KRAKEN_PAIRS.map(p => fetchCandles(p, minutes)))
      if (!alive) return
      const next: Partial<Record<LivePair, Candle[]>> = {}
      res.forEach((r, i) => { if (r.status === 'fulfilled') next[KRAKEN_PAIRS[i]] = r.value })
      candleInterval.current = minutes * 60
      setCandles(c => ({ ...c, ...next }))
    }
    const start = () => {
      kraken(); coinbase(); loadCandles()
      timers.push(window.setInterval(kraken, KRAKEN_MS), window.setInterval(coinbase, COINBASE_MS), window.setInterval(loadCandles, CANDLE_MS))
    }
    const stop = () => { timers.forEach(clearInterval); timers.length = 0 }
    const onVis = () => {
      if (document.hidden) { hiddenAt = nowSec(); stop(); return }
      stop()
      if (hiddenAt !== null && nowSec() - hiddenAt > RECHECK_AFTER_HIDDEN) {
        // 백그라운드에서 돌아옴: 새 봉을 받은 뒤 닫아둔 동안을 다시 확인
        replayed.current = false
        startedAt.current = nowSec()
        setCandles({})
        setLastOk({ kraken: null, coinbase: null })
      }
      hiddenAt = null
      start()
    }
    start()
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; stop(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const feedDown = (f: Feed, now: number) => {
    const t = lastOk[f]
    return t === null ? now - startedAt.current > DOWN_AFTER[f] : now - t > DOWN_AFTER[f]
  }

  // ── 강제청산 확인: 먼저 닫아둔 동안을 한 번 다시 보고, 그 뒤에만 실시간으로 본다 ──
  useEffect(() => {
    const a = accRef.current
    if (!replayed.current) {
      const haveQuotes = LIVE_PAIRS.every(p => mids[p] !== undefined || !a.positions[p])
      const missingCandles = KRAKEN_PAIRS.some(p => a.positions[p] && !candles[p])
      if (!haveQuotes || missingCandles) return
      replayed.current = true
      const r = replayOffline(a, candles, mids, nowSec(), candleInterval.current)
      commit(r.acc, r.trades)
      if (r.stoppedAt !== null) setNotice({ at: r.stoppedAt, offline: true, trades: r.trades })
      return // 이번 렌더에서는 실시간 확인을 하지 않는다 (옛 계좌로 덮어쓰지 않도록)
    }
    if (liveShouldStopOut(a, mids)) {
      const r = stopOutAll(a, mids, nowSec())
      commit({ ...r.acc, lastSeen: nowSec() }, r.trades)
      setNotice({ at: nowSec(), offline: false, trades: r.trades })
    } else if (nowSec() - a.lastSeen > 30 && !LIVE_PAIRS.some(p => a.positions[p] && feedDown(feedOf(p), nowSec()))) {
      commit({ ...a, lastSeen: nowSec() })
    }
  })

  const info = (pair: LivePair): PairInfo => {
    const now = nowSec()
    const down = feedDown(feedOf(pair), now)
    if (hasHistory(pair)) {
      const cs = (candles[pair] ?? []).filter(c => c.t >= now - 86400)
      const last = candles[pair]?.[candles[pair]!.length - 1]
      return { mid: mids[pair], prev: cs[0]?.o, spark: cs.map(c => c.c), stale: last ? isStale(last.t, now) : false, down }
    }
    void tickVersion
    const ticks = getTicks(pair).filter(t => t.t >= now - 86400)
    return { mid: mids[pair], prev: ticks.length > 1 ? ticks[0].p : undefined, spark: ticks.map(t => t.p), stale: isFxWeekend(now), down }
  }

  const order = (pair: LivePair, side: Side, margin: number, leverage: number): boolean => {
    const i = info(pair)
    if (i.stale || i.down || !replayed.current) return false
    const a = accRef.current
    const next = openLive(a, pair, side, margin, leverage, mids, nowSec())
    if (next === a) return false
    commit(next)
    return true
  }

  const closePos = (pair: LivePair) => {
    const mid = mids[pair]
    const a = accRef.current
    if (mid === undefined || !a.positions[pair]) return
    const r = closeLive(a, pair, mid, nowSec(), 'manual')
    commit(r.acc, r.trade ? [r.trade] : [])
  }

  const reset = () => { resetLive(nowSec()); const a = getLive(nowSec()); accRef.current = a; setAcc(a) }

  /** 시세를 즉시 한 번 다시 받는다 */
  const refresh = async () => { await Promise.all([pollers.current?.kraken(), pollers.current?.coinbase()]) }

  const offline = (['kraken', 'coinbase'] as Feed[]).some(f => feedDown(f, nowSec()))

  return { acc, mids, offline, notice, dismissNotice: () => setNotice(null), info, order, closePos, reset, refresh }
}

export type LiveApi = ReturnType<typeof useLive>
