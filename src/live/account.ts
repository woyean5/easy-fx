import { open, START_BALANCE, STOP_OUT_LEVEL, unrealizedPnl } from '../engine/engine'
import type { Position, Side } from '../engine/types'
import type { Candle, LivePair, Mids } from './quotes'

export interface LivePosition extends Position { openedAt: number }

export interface LiveAccount {
  balance: number
  positions: Partial<Record<LivePair, LivePosition>>
  /** 마지막으로 시세를 확인한 시각 (unix 초) */
  lastSeen: number
}

export interface ClosedTrade {
  pair: LivePair
  side: Side
  leverage: number
  margin: number
  pnl: number
  openedAt: number
  closedAt: number
  reason: 'manual' | 'stopout'
}

const entries = (acc: LiveAccount) => Object.entries(acc.positions) as [LivePair, LivePosition][]

export function newLiveAccount(now: number): LiveAccount {
  return { balance: START_BALANCE, positions: {}, lastSeen: now }
}

export function usedMargin(acc: LiveAccount): number {
  return entries(acc).reduce((s, [, p]) => s + p.margin, 0)
}

/** 시세가 없는 통화쌍은 손익 0으로 본다 (진입가 그대로) */
export function livePnl(pair: LivePair, pos: LivePosition, mids: Mids): number {
  const mid = mids[pair]
  return mid === undefined ? 0 : unrealizedPnl(pair, pos, mid)
}

export function liveEquity(acc: LiveAccount, mids: Mids): number {
  return acc.balance + entries(acc).reduce((s, [pair, p]) => s + livePnl(pair, p, mids), 0)
}

export function freeMargin(acc: LiveAccount, mids: Mids): number {
  return liveEquity(acc, mids) - usedMargin(acc)
}

export function liveMarginLevel(acc: LiveAccount, mids: Mids): number | null {
  const used = usedMargin(acc)
  return used > 0 ? (liveEquity(acc, mids) / used) * 100 : null
}

export function liveShouldStopOut(acc: LiveAccount, mids: Mids): boolean {
  const level = liveMarginLevel(acc, mids)
  return level !== null && level < STOP_OUT_LEVEL
}

export function openLive(acc: LiveAccount, pair: LivePair, side: Side, margin: number, leverage: number, mids: Mids, now: number): LiveAccount {
  const mid = mids[pair]
  if (mid === undefined || acc.positions[pair]) return acc
  const opened = open({ balance: freeMargin(acc, mids), position: null }, pair, side, margin, leverage, mid)
  if (!opened.position) return acc
  return { ...acc, positions: { ...acc.positions, [pair]: { ...opened.position, openedAt: now } } }
}

export function closeLive(acc: LiveAccount, pair: LivePair, mid: number, now: number, reason: ClosedTrade['reason']): { acc: LiveAccount; trade: ClosedTrade | null } {
  const pos = acc.positions[pair]
  if (!pos) return { acc, trade: null }
  const pnl = unrealizedPnl(pair, pos, mid)
  const positions = { ...acc.positions }
  delete positions[pair]
  return {
    acc: { ...acc, balance: acc.balance + pnl, positions },
    trade: { pair, side: pos.side, leverage: pos.leverage, margin: pos.margin, pnl, openedAt: pos.openedAt, closedAt: now, reason },
  }
}

export function stopOutAll(acc: LiveAccount, mids: Mids, now: number): { acc: LiveAccount; trades: ClosedTrade[] } {
  const trades: ClosedTrade[] = []
  let a = acc
  for (const [pair, pos] of entries(acc)) {
    const r = closeLive(a, pair, mids[pair] ?? pos.entry, now, 'stopout')
    a = r.acc
    if (r.trade) trades.push(r.trade)
  }
  return { acc: a, trades }
}

/**
 * 앱을 닫아둔 동안의 봉을 시간순으로 훑어, 각 포지션에 가장 불리한 가격(매수=저가, 매도=고가)에서
 * 계좌 유지율이 강제청산선을 넘었는지 확인한다. 넘었으면 그 봉 시각에 전부 청산한다.
 */
export function replayOffline(
  acc: LiveAccount,
  candles: Partial<Record<LivePair, Candle[]>>,
  mids: Mids,
  now: number,
  /** 불러온 봉의 길이(초). 마지막 확인 시각이 들어 있는 봉부터 본다 */
  intervalSec = 900,
): { acc: LiveAccount; trades: ClosedTrade[]; stoppedAt: number | null } {
  const from = Math.floor(acc.lastSeen / intervalSec) * intervalSec
  // 포지션을 잡기 전에 시작한 봉은 그 전 가격이 섞여 있으므로 그 포지션에는 쓰지 않는다
  const usable = (pair: LivePair) => (candles[pair] ?? []).filter(c => c.t >= from && c.t >= acc.positions[pair]!.openedAt)
  const times = [...new Set(entries(acc).flatMap(([pair]) => usable(pair).map(c => c.t)))].sort((a, b) => a - b)
  const last: Mids = { ...mids }
  // 봉이 있는 통화쌍은 오래된 값부터 다시 채운다
  for (const [pair] of entries(acc)) if (candles[pair]?.length) last[pair] = acc.positions[pair]!.entry

  for (const t of times) {
    const worst: Mids = { ...last }
    for (const [pair, pos] of entries(acc)) {
      const c = usable(pair).find(x => x.t === t)
      if (!c) continue
      worst[pair] = pos.side === 'buy' ? c.l : c.h
      last[pair] = c.c
    }
    if (liveShouldStopOut(acc, worst)) {
      const r = stopOutAll(acc, worst, t)
      return { acc: { ...r.acc, lastSeen: now }, trades: r.trades, stoppedAt: t }
    }
  }
  return { acc: { ...acc, lastSeen: now }, trades: [], stoppedAt: null }
}
