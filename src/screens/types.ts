import type { Side } from '../engine/types'
import type { Scenario } from '../scenarios/catalog'
import type { PriceSeries } from '../scenarios/load'
import type { RoundRecord } from '../storage/storage'

export interface Trade { index: number; side: Side | 'close' }

export interface RoundResult {
  scenario: Scenario
  series: PriceSeries
  record: RoundRecord
  trades: Trade[]
  finalBalance: number
}

export type Route =
  | { name: 'home' }
  | { name: 'trade'; scenario: Scenario; leverage: number }
  | { name: 'result'; result: RoundResult }

export const PAIR_LABEL: Record<string, string> = { USDJPY: 'USD/JPY', EURUSD: 'EUR/USD', AUDUSD: 'AUD/USD', GBPUSD: 'GBP/USD' }

export const fmtPrice = (pair: string, p: number) => p.toFixed(pair.endsWith('JPY') ? 3 : 5)
export const fmtUsd = (n: number) => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
export const fmtPct = (n: number) => (n > 0 ? '+' : '') + n.toFixed(2) + '%'
