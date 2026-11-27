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

export const PAIR_LABEL: Record<string, string> = { USDJPY: 'USD/JPY', EURUSD: 'EUR/USD', AUDUSD: 'AUD/USD', GBPUSD: 'GBP/USD', USDKRW: 'USD/KRW', USDCAD: 'USD/CAD' }

export const fmtPrice = (pair: string, p: number) => p.toFixed(pair.endsWith('KRW') ? 2 : pair.endsWith('JPY') ? 3 : 5)
/** 원화 금액: 10,000,000원 */
export const fmtWon = (n: number) => {
  const r = Math.round(n)
  return (r < 0 ? '-' : '') + Math.abs(r).toLocaleString('ko-KR') + '원'
}
/** 달러 금액 (거래 규모 안내용): $1,234 */
export const fmtUsd = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
export const fmtPct = (n: number) => {
  const r = Number(n.toFixed(2))
  return (r > 0 ? '+' : '') + (r === 0 ? '0.00' : r.toFixed(2)) + '%'
}
/** 등락 배지 색: 0으로 반올림되면 회색 */
export const trendClass = (n: number) => (Math.abs(n) < 0.005 ? 'flat' : n > 0 ? 'up' : 'down')
