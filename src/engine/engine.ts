import type { Account, Pair, Position, Side } from './types'

export const START_BALANCE = 10000
export const STOP_OUT_LEVEL = 50

export const SPREAD_PIPS: Record<Pair, number> = {
  USDJPY: 1.0,
  EURUSD: 0.8,
  AUDUSD: 1.0,
  GBPUSD: 1.2,
}

export function pipSize(pair: Pair): number {
  return pair.endsWith('JPY') ? 0.01 : 0.0001
}

export function quote(pair: Pair, mid: number): { bid: number; ask: number } {
  const half = (SPREAD_PIPS[pair] * pipSize(pair)) / 2
  return { bid: mid - half, ask: mid + half }
}

const baseIsUsd = (pair: Pair) => pair.startsWith('USD')
const quoteIsUsd = (pair: Pair) => pair.endsWith('USD')

export function open(acc: Account, pair: Pair, side: Side, margin: number, leverage: number, mid: number): Account {
  if (acc.position || !(margin > 0) || margin > acc.balance) return acc
  const { bid, ask } = quote(pair, mid)
  const entry = side === 'buy' ? ask : bid
  const notional = margin * leverage
  const units = baseIsUsd(pair) ? notional : notional / entry
  return { ...acc, position: { side, margin, leverage, entry, units } }
}

export function unrealizedPnl(pair: Pair, pos: Position, mid: number): number {
  const { bid, ask } = quote(pair, mid)
  const exit = pos.side === 'buy' ? bid : ask
  const dir = pos.side === 'buy' ? 1 : -1
  const pnlQuote = pos.units * (exit - pos.entry) * dir
  return quoteIsUsd(pair) ? pnlQuote : pnlQuote / exit
}

export function equity(acc: Account, pair: Pair, mid: number): number {
  return acc.position ? acc.balance + unrealizedPnl(pair, acc.position, mid) : acc.balance
}

export function marginLevel(acc: Account, pair: Pair, mid: number): number | null {
  if (!acc.position) return null
  return (equity(acc, pair, mid) / acc.position.margin) * 100
}

export function close(acc: Account, pair: Pair, mid: number): Account {
  if (!acc.position) return acc
  return { balance: acc.balance + unrealizedPnl(pair, acc.position, mid), position: null }
}

export function shouldStopOut(acc: Account, pair: Pair, mid: number): boolean {
  const level = marginLevel(acc, pair, mid)
  return level !== null && level < STOP_OUT_LEVEL
}
