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
