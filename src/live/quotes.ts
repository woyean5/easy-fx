export type LivePair = 'EURUSD' | 'GBPUSD' | 'AUDUSD' | 'USDCAD' | 'USDJPY' | 'USDKRW'
export type Mids = Partial<Record<LivePair, number>>

export const LIVE_PAIRS: LivePair[] = ['USDKRW', 'USDJPY', 'EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD']

export const PAIR_NAME_KO: Record<LivePair, string> = {
  USDKRW: '달러/원',
  USDJPY: '달러/엔',
  EURUSD: '유로/달러',
  GBPUSD: '파운드/달러',
  AUDUSD: '호주달러/달러',
  USDCAD: '달러/캐나다달러',
}

/** Kraken에서 거래가 충분한 통화쌍만. USD/JPY는 체결이 적어 가격이 어긋나므로 제외 */
const KRAKEN_KEYS: Record<string, LivePair> = { ZEURZUSD: 'EURUSD', ZGBPZUSD: 'GBPUSD', AUDUSD: 'AUDUSD', ZUSDZCAD: 'USDCAD' }
export const KRAKEN_PAIRS: LivePair[] = ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD']
export const hasHistory = (p: LivePair) => KRAKEN_PAIRS.includes(p)

export interface Candle { t: number; o: number; h: number; l: number; c: number }

type KrakenJson = { error: string[]; result: Record<string, unknown> }

function check(json: KrakenJson) {
  if (!json || (json.error && json.error.length)) throw new Error('kraken: ' + (json?.error ?? []).join(','))
}

export function parseKrakenTicker(json: KrakenJson): Mids {
  check(json)
  const out: Mids = {}
  for (const [k, v] of Object.entries(json.result)) {
    const pair = KRAKEN_KEYS[k]
    const t = v as { a: string[]; b: string[] }
    if (pair) out[pair] = (Number(t.a[0]) + Number(t.b[0])) / 2
  }
  return out
}

export function parseCoinbaseRates(json: { data: { currency?: string; rates: Record<string, string> } }): Mids {
  const r = json.data.rates
  const out: Mids = {}
  if (Number(r.JPY) > 0) out.USDJPY = Number(r.JPY)
  if (Number(r.KRW) > 0) out.USDKRW = Number(r.KRW)
  return out
}

export function parseKrakenOhlc(json: KrakenJson): Candle[] {
  check(json)
  const key = Object.keys(json.result).find(k => k !== 'last')
  const rows = (key ? json.result[key] : []) as (string | number)[][]
  return rows.map(r => ({ t: Number(r[0]), o: Number(r[1]), h: Number(r[2]), l: Number(r[3]), c: Number(r[4]) }))
}

export const STALE_SECONDS = 3600
export function isStale(lastT: number, now: number): boolean {
  return now - lastT > STALE_SECONDS
}

export async function fetchKraken(): Promise<Mids> {
  const r = await fetch('https://api.kraken.com/0/public/Ticker?pair=EURUSD,GBPUSD,AUDUSD,USDCAD')
  return parseKrakenTicker(await r.json())
}

export async function fetchCoinbase(): Promise<Mids> {
  const r = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD')
  return parseCoinbaseRates(await r.json())
}

/** interval: 분 단위 (15, 60, 240) */
export async function fetchCandles(pair: LivePair, interval: number, since?: number): Promise<Candle[]> {
  const q = since ? `&since=${since}` : ''
  const r = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}${q}`)
  return parseKrakenOhlc(await r.json())
}

/** 외환시장 주말 휴장: 금요일 22:00 UTC ~ 일요일 22:00 UTC */
export function isFxWeekend(nowSec: number): boolean {
  const d = new Date(nowSec * 1000)
  const day = d.getUTCDay(), h = d.getUTCHours()
  return (day === 5 && h >= 22) || day === 6 || (day === 0 && h < 22)
}
