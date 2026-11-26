import { newLiveAccount, type ClosedTrade, type LiveAccount } from '../live/account'
import type { LivePair } from '../live/quotes'
// 저장은 전부 이 모듈을 거친다. 2단계에서 서버를 붙일 때 이 파일만 바꾼다.
export interface RoundRecord {
  scenarioId: string
  leverage: number
  returnPct: number
  stoppedOut: boolean
  at: number
}

const P = 'easyfx:'
let memory: Record<string, string> = {}

export function __resetMemory() { memory = {} }

function read(key: string): string | null {
  try {
    const v = localStorage.getItem(P + key)
    if (v !== null) return v
  } catch { /* 사생활 보호 모드 등 */ }
  return memory[key] ?? null
}

function write(key: string, value: string) {
  memory[key] = value
  try { localStorage.setItem(P + key, value) } catch { /* 메모리에만 저장 */ }
}

export function getNickname(): string | null { return read('nickname') }

export function setNickname(n: string): void {
  const t = n.trim()
  if (t.length >= 1 && [...t].length <= 12) write('nickname', t)
}

export function getRecords(): RoundRecord[] {
  try { return JSON.parse(read('records') ?? '[]') } catch { return [] }
}

export function addRecord(r: RoundRecord): void {
  write('records', JSON.stringify([...getRecords(), r]))
}

export function bestReturn(scenarioId: string): number | null {
  const rs = getRecords().filter(r => r.scenarioId === scenarioId)
  return rs.length ? Math.max(...rs.map(r => r.returnPct)) : null
}

export function isGuideDone(): boolean { return read('guideDone') === '1' }
export function setGuideDone(): void { write('guideDone', '1') }

// ── 실시간 계좌 ──

function readJson<T>(key: string, fallback: T): T {
  try { const v = read(key); return v === null ? fallback : JSON.parse(v) } catch { return fallback }
}

export function getLive(now: number): LiveAccount {
  const v = readJson<LiveAccount | null>('live', null)
  const ok = v && typeof v === 'object' && Number.isFinite(v.balance) && Number.isFinite(v.lastSeen) && v.positions && typeof v.positions === 'object'
  return ok ? v : newLiveAccount(now)
}
export function saveLive(acc: LiveAccount): void { write('live', JSON.stringify(acc)) }

export function getLiveHistory(): ClosedTrade[] { return readJson('liveHistory', []) }
export function addLiveTrades(trades: ClosedTrade[]): void {
  if (trades.length) write('liveHistory', JSON.stringify([...getLiveHistory(), ...trades]))
}

/** 계좌를 $10,000로 되돌리고 실시간 거래 기록도 지운다. 시나리오 기록은 남긴다. */
export function resetLive(now: number): void {
  saveLive(newLiveAccount(now))
  write('liveHistory', '[]')
}

export const MAX_TICKS = 2000
export function getTicks(pair: LivePair): { t: number; p: number }[] { return readJson(`ticks:${pair}`, []) }
export function pushTick(pair: LivePair, t: number, p: number): void {
  const ticks = getTicks(pair)
  if (ticks.length && ticks[ticks.length - 1].p === p && t - ticks[ticks.length - 1].t < 300) return
  write(`ticks:${pair}`, JSON.stringify([...ticks, { t, p }].slice(-MAX_TICKS)))
}
