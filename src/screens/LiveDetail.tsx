import { useEffect, useMemo, useRef, useState } from 'react'
import { LiveChart, type Point } from '../components/LiveChart'
import { LEVERAGES, LOCKED_LEVERAGES } from '../components/stopOut'
import { freeMargin, livePnl } from '../live/account'
import { fetchCandles, hasHistory, PAIR_NAME_KO, type LivePair } from '../live/quotes'
import type { LiveApi } from '../live/useLive'
import { getTicks, isGuideDone } from '../storage/storage'
import { InfoButton } from '../guide/InfoButton'
import { isTooSoon } from './tapGuard'
import { fmtPct, fmtPrice, fmtUsd, fmtWon, PAIR_LABEL } from './types'

type Range = '1D' | '1W' | '1M'
const RANGES: { id: Range; label: string; interval: number; seconds: number }[] = [
  { id: '1D', label: '1일', interval: 15, seconds: 86400 },
  { id: '1W', label: '1주', interval: 60, seconds: 7 * 86400 },
  { id: '1M', label: '1개월', interval: 240, seconds: 30 * 86400 },
]

interface Props { pair: LivePair; live: LiveApi; onClose: () => void; onOpenGuide: () => void }

export function LiveDetail({ pair, live, onClose, onOpenGuide }: Props) {
  const { acc, mids } = live
  const info = live.info(pair)
  const mid = info.mid
  const [range, setRange] = useState<Range>('1D')
  const [hist, setHist] = useState<Point[]>([])
  const [hover, setHover] = useState<Point | null>(null)
  const [lev, setLev] = useState(1)
  const [pct, setPct] = useState(20)
  const [msg, setMsg] = useState<string | null>(null)
  const lastAction = useRef<number | null>(null)
  const guideDone = isGuideDone()
  const r = RANGES.find(x => x.id === range)!

  useEffect(() => {
    let alive = true
    const now = Date.now() / 1000
    if (hasHistory(pair)) {
      fetchCandles(pair, r.interval)
        .then(cs => { if (alive) setHist(cs.filter(c => c.t >= now - r.seconds).map(c => ({ t: c.t, p: c.c }))) })
        .catch(() => alive && setHist([]))
    } else {
      setHist(getTicks(pair).filter(t => t.t >= now - r.seconds))
    }
    return () => { alive = false }
  }, [pair, r.interval, r.seconds])

  const points = useMemo(() => {
    if (mid === undefined) return hist
    const now = Math.floor(Date.now() / 1000)
    return [...hist.filter(p => p.t < now), { t: now, p: mid }]
  }, [hist, mid])

  const pos = acc.positions[pair]
  const pnl = pos ? livePnl(pair, pos, mids) : 0
  const first = points[0]?.p
  const shown = hover ?? (mid !== undefined ? { t: 0, p: mid } : null)
  const chg = shown && first ? ((shown.p - first) / first) * 100 : null
  const free = Math.max(0, freeMargin(acc, mids))
  const margin = Math.floor((free * pct) / 100)
  const blocked = info.stale || info.down || mid === undefined || mids.USDKRW === undefined

  const tap = () => {
    if (isTooSoon(lastAction.current, performance.now())) return false
    lastAction.current = performance.now()
    return true
  }
  const buySell = (side: 'buy' | 'sell') => {
    if (!tap()) return
    setMsg(live.order(pair, side, margin, lev) ? null : '주문할 수 없어요. 여유 증거금이나 시장 상태를 확인해 주세요.')
  }

  return (
    <div className="detail" role="dialog" aria-label={`${PAIR_LABEL[pair]} 상세`}>
      <div className="sheet-handle" />
      <div className="detail-head">
        <div>
          <h1>{PAIR_LABEL[pair]}</h1>
          <div className="muted">{PAIR_NAME_KO[pair]}</div>
        </div>
        <button className="close-btn" aria-label="닫기" onClick={onClose}>✕</button>
      </div>

      <div>
        <div className="detail-price num">{shown ? fmtPrice(pair, shown.p) : '—'}</div>
        <div className={`num ${chg === null ? 'muted' : chg >= 0 ? 'up' : 'down'}`}>
          {chg === null ? '' : fmtPct(chg)} <span className="muted small">{hover ? new Date(hover.t * 1000).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : r.label}</span>
        </div>
      </div>

      <div className="segmented" role="tablist">
        {RANGES.map(x => (
          <button key={x.id} role="tab" aria-selected={range === x.id} className={range === x.id ? 'on' : ''} onClick={() => setRange(x.id)}>{x.label}</button>
        ))}
      </div>

      <LiveChart points={points} onHover={setHover} height={220} />
      {points.length > 1 && (
        <div className="stat-grid num">
          <div><span>시작</span><b>{fmtPrice(pair, points[0].p)}</b></div>
          <div><span>고가</span><b>{fmtPrice(pair, Math.max(...points.map(x => x.p)))}</b></div>
          <div><span>저가</span><b>{fmtPrice(pair, Math.min(...points.map(x => x.p)))}</b></div>
        </div>
      )}
      {!hasHistory(pair) && <p className="footnote">이 통화는 과거 차트를 제공하지 않아 앱을 켜둔 동안 받은 시세로 그려요.</p>}

      {info.stale && <div className="banner">지금은 외환시장이 쉬는 시간이에요. 주문할 수 없어요.</div>}
      {info.down && <div className="banner">시세 연결이 끊겨서 지금은 주문할 수 없어요.</div>}

      {pos ? (
        <div className="group">
          <div className="cell static">
            <div className="cell-main">
              <b>{pos.side === 'buy' ? '매수' : '매도'} {pos.leverage}배</b>
              <span className="muted small num">진입 {fmtPrice(pair, pos.entry)} · 증거금 {fmtWon(pos.margin)}</span>
            </div>
            <b className={`num ${pnl >= 0 ? 'up' : 'down'}`} style={{ fontSize: 20 }}>{pnl >= 0 ? '+' : ''}{fmtWon(pnl)}</b>
          </div>
          <button className="btn primary wide" style={{ marginTop: 12 }} disabled={mid === undefined} onClick={() => { if (tap()) live.closePos(pair) }}>청산하기</button>
        </div>
      ) : (
        <>
          <div>
            <div className="row-label small muted">레버리지 <InfoButton term="leverage" /></div>
            <div className="segmented">
              {LEVERAGES.map(l => {
                const locked = !guideDone && LOCKED_LEVERAGES.includes(l)
                return (
                  <button key={l} aria-disabled={locked} className={`${lev === l ? 'on' : ''} ${locked ? 'locked' : ''}`}
                    onClick={() => (locked ? onOpenGuide() : setLev(l))}>
                    {l}배{locked ? ' 🔒' : ''}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="slider">
            <div className="meta small"><span className="muted">증거금 <InfoButton term="margin" /></span><span className="num">{fmtWon(margin)} → 거래 {fmtWon(margin * lev)}</span></div>
            {mids.USDKRW !== undefined && <div className="muted small num">달러로 약 {fmtUsd((margin * lev) / mids.USDKRW)}어치 거래 · 1달러 = {Math.round(mids.USDKRW).toLocaleString('ko-KR')}원</div>}
            <input type="range" min={10} max={100} step={10} value={pct} onChange={e => setPct(Number(e.target.value))} aria-label="증거금 비율" />
            <div className="muted small num">여유 증거금 {fmtWon(free)}</div>
          </div>
          {msg && <div className="banner">{msg}</div>}
          <div className="actions">
            <button className="btn buy" disabled={blocked || margin <= 0} onClick={() => buySell('buy')}>매수</button>
            <button className="btn sell" disabled={blocked || margin <= 0} onClick={() => buySell('sell')}>매도</button>
          </div>
        </>
      )}
    </div>
  )
}
