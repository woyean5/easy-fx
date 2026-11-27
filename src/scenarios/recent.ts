import type { Candle } from '../live/quotes'
import type { PriceSeries } from './load'
import { fmtPct, fmtPrice } from '../screens/types'

const DAY = 86400

/** Kraken 1시간봉 → 최근 30일 종가 시리즈 */
export function candlesToSeries(id: string, candles: Candle[]): PriceSeries {
  const sorted = [...candles].sort((a, b) => a.t - b.t)
  const end = sorted[sorted.length - 1]?.t ?? 0
  const recent = sorted.filter(c => c.t >= end - 30 * DAY)
  return { id, t: recent.map(c => c.t), p: recent.map(c => c.c) }
}

/** 결과 화면 해설: 지어낸 이야기 대신 실제 데이터에서 계산한 사실만 */
export function summarize(pair: string, s: PriceSeries): string[] {
  const first = s.p[0], last = s.p[s.p.length - 1]
  const chg = ((last - first) / first) * 100
  const fmtDay = (t: number) => { const d = new Date(t * 1000); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일` }

  // 날짜(UTC)별 마지막 가격으로 하루 변동률 계산
  const closes: { t: number; p: number }[] = []
  s.t.forEach((t, i) => {
    const day = Math.floor(t / DAY)
    const prev = closes[closes.length - 1]
    if (prev && Math.floor(prev.t / DAY) === day) prev.p = s.p[i]
    else closes.push({ t, p: s.p[i] })
  })
  let best: { t: number; pct: number } | null = null
  for (let i = 1; i < closes.length; i++) {
    const pct = ((closes[i].p - closes[i - 1].p) / closes[i - 1].p) * 100
    if (!best || Math.abs(pct) > Math.abs(best.pct)) best = { t: closes[i].t, pct }
  }

  const lines = [
    `한 달 동안 ${fmtPct(chg)} 움직였어요. (시작 ${fmtPrice(pair, first)} → 끝 ${fmtPrice(pair, last)})`,
    `이 기간의 최고 ${fmtPrice(pair, Math.max(...s.p))}, 최저 ${fmtPrice(pair, Math.min(...s.p))}.`,
  ]
  if (best) lines.push(`가장 크게 움직인 날은 ${fmtDay(best.t)}(${fmtPct(best.pct)})이었어요.`)
  lines.push('실시간 탭에서 같은 통화의 지금 시세를 이어서 볼 수 있어요.')
  return lines
}

export function parseAvailable(json: unknown): Set<string> {
  const ids = (json as { ids?: unknown } | null)?.ids
  return new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [])
}

export async function loadAvailable(): Promise<Set<string>> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}scenarios/index.json`)
    return parseAvailable(r.ok ? await r.json() : null)
  } catch { return new Set() }
}
