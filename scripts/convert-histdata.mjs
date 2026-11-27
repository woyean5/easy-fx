// HistData 1분봉 CSV(zip 해제본)를 시나리오용 15분봉 JSON으로 바꾼다.
// 사용법: node scripts/convert-histdata.mjs <csv 폴더>
// CSV 형식: 20220901 000000;open;high;low;close;volume  (시간대: EST, 서머타임 없음 = UTC-5)
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SCENARIOS = [
  { id: 'yen-crash-2022', pair: 'USDJPY', from: '2022-09-01', to: '2022-10-31' },
  { id: 'covid-dollar-2020', pair: 'EURUSD', from: '2020-03-01', to: '2020-03-31' },
  { id: 'brexit-2016', pair: 'GBPUSD', from: '2016-06-15', to: '2016-07-15' },
  { id: 'carry-unwind-2024', pair: 'USDJPY', from: '2024-07-15', to: '2024-08-15' },
]
const dir = process.argv[2]
if (!dir) { console.error('usage: node scripts/convert-histdata.mjs <csv dir>'); process.exit(1) }

const rows = {}
for (const f of readdirSync(dir).filter(f => f.toLowerCase().endsWith('.csv'))) {
  const pair = (f.match(/(USDJPY|EURUSD|GBPUSD|AUDUSD)/i) || [])[1]?.toUpperCase()
  if (!pair) continue
  for (const line of readFileSync(join(dir, f), 'utf8').split(/\r?\n/)) {
    const [dt, , , , close] = line.split(';')
    if (!close) continue
    const m = dt.match(/^(\d{4})(\d{2})(\d{2}) (\d{2})(\d{2})(\d{2})$/)
    if (!m) continue
    const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] + 5, +m[5]) / 1000 // EST → UTC
    ;(rows[pair] ??= new Map()).set(t, +close)
  }
}

mkdirSync('public/scenarios', { recursive: true })
const done = []
for (const s of SCENARIOS) {
  const m = rows[s.pair]
  const start = Date.parse(s.from + 'T00:00:00Z') / 1000
  const end = Date.parse(s.to + 'T23:59:59Z') / 1000
  const buckets = new Map()
  for (const [t, c] of [...(m ?? new Map())].sort((a, b) => a[0] - b[0])) {
    if (t < start || t > end) continue
    buckets.set(Math.floor(t / 900) * 900, c) // 15분 구간의 마지막 종가
  }
  const t = [...buckets.keys()], p = [...buckets.values()]
  if (t.length < 500) { console.error(`✗ ${s.id}: ${t.length} points — ${s.pair} ${s.from}~${s.to} CSV가 부족해요`); process.exitCode = 1; continue }
  writeFileSync(`public/scenarios/${s.id}.json`, JSON.stringify({ id: s.id, t, p }))
  done.push(s.id)
  console.log(`✓ ${s.id}: ${t.length} points, ${p[0]} → ${p[p.length - 1]}`)
}
// 앱이 '준비 중' 여부를 판단하는 목록
writeFileSync('public/scenarios/index.json', JSON.stringify({ ids: done }))
console.log(`index.json: ${done.length}개 시나리오`)
