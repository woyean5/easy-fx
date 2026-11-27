import type { Account, Pair, Position, Side } from './types'

/** 시작 자산 (원) */
export const START_BALANCE = 10_000_000
/** 원/달러를 받지 못했을 때 쓰는 값 */
export const FALLBACK_KRW = 1350
export const STOP_OUT_LEVEL = 50

export const SPREAD_PIPS: Record<Pair, number> = {
  USDJPY: 1.0,
  EURUSD: 0.8,
  AUDUSD: 1.0,
  GBPUSD: 1.2,
  USDKRW: 100,
  USDCAD: 1.5,
}

export function pipSize(pair: Pair): number {
  return pair.endsWith('JPY') || pair.endsWith('KRW') ? 0.01 : 0.0001
}

export function quote(pair: Pair, mid: number): { bid: number; ask: number } {
  const half = (SPREAD_PIPS[pair] * pipSize(pair)) / 2
  return { bid: mid - half, ask: mid + half }
}

const baseIsUsd = (pair: Pair) => pair.startsWith('USD')
const quoteIsUsd = (pair: Pair) => pair.endsWith('USD')

/*
 * krw: 1달러가 몇 원인지. 계좌 금액(잔고·증거금·손익)은 원화,
 * 거래 금액(units)은 달러 기준으로 계산한다. krw = 1이면 달러 계좌와 같다.
 */
export function open(acc: Account, pair: Pair, side: Side, margin: number, leverage: number, mid: number, krw = 1): Account {
  if (acc.position || !(margin > 0) || margin > acc.balance) return acc
  const { bid, ask } = quote(pair, mid)
  const entry = side === 'buy' ? ask : bid
  const notional = (margin * leverage) / krw
  const units = baseIsUsd(pair) ? notional : notional / entry
  return { ...acc, position: { side, margin, leverage, entry, units } }
}

export function unrealizedPnl(pair: Pair, pos: Position, mid: number, krw = 1): number {
  const { bid, ask } = quote(pair, mid)
  const exit = pos.side === 'buy' ? bid : ask
  const dir = pos.side === 'buy' ? 1 : -1
  const pnlQuote = pos.units * (exit - pos.entry) * dir
  return (quoteIsUsd(pair) ? pnlQuote : pnlQuote / exit) * krw
}

export function equity(acc: Account, pair: Pair, mid: number, krw = 1): number {
  return acc.position ? acc.balance + unrealizedPnl(pair, acc.position, mid, krw) : acc.balance
}

export function marginLevel(acc: Account, pair: Pair, mid: number, krw = 1): number | null {
  if (!acc.position) return null
  return (equity(acc, pair, mid, krw) / acc.position.margin) * 100
}

export function close(acc: Account, pair: Pair, mid: number, krw = 1): Account {
  if (!acc.position) return acc
  return { balance: acc.balance + unrealizedPnl(pair, acc.position, mid, krw), position: null }
}

export function shouldStopOut(acc: Account, pair: Pair, mid: number, krw = 1): boolean {
  const level = marginLevel(acc, pair, mid, krw)
  return level !== null && level < STOP_OUT_LEVEL
}
