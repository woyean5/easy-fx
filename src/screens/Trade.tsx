import { useEffect, useRef, useState } from 'react'
import type { Scenario } from '../scenarios/catalog'
import { loadSeries, type PriceSeries } from '../scenarios/load'
import { useReplay } from '../replay/useReplay'
import { ROUND_SECONDS } from '../replay/replay'
import { close, equity, marginLevel, open, shouldStopOut, START_BALANCE, unrealizedPnl } from '../engine/engine'
import type { Account, Side } from '../engine/types'
import { getRecords } from '../storage/storage'
import { PriceChart } from '../components/PriceChart'
import { InfoButton } from '../guide/InfoButton'
import { isTooSoon } from './tapGuard'
import { PAIR_LABEL, fmtPct, fmtPrice, fmtUsd, type RoundResult, type Trade } from './types'

interface Props {
  scenario: Scenario
  leverage: number
  onFinish: (r: RoundResult) => void
  onQuit: () => void
}

export function TradeScreen({ scenario, leverage, onFinish, onQuit }: Props) {
  const [series, setSeries] = useState<PriceSeries | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadSeries(scenario.id).then(setSeries).catch(() => setError(true))
  }, [scenario.id])

  if (error) {
    return (
      <div className="screen overlay" style={{ position: 'static', background: 'none' }}>
        <p>데이터를 불러오지 못했어요.</p>
        <button className="btn primary wide" onClick={onQuit}>홈으로</button>
      </div>
    )
  }
  if (!series) return <div className="screen"><p className="muted">불러오는 중…</p></div>
  return <Round scenario={scenario} leverage={leverage} series={series} onFinish={onFinish} onQuit={onQuit} />
}

function Round({ scenario, leverage, series, onFinish, onQuit }: Props & { series: PriceSeries }) {
  const { pair } = scenario
  const { index, mid, elapsedMs, done, paused, pause, resume } = useReplay(series)
  const [acc, setAcc] = useState<Account>({ balance: START_BALANCE, position: null })
  const [pct, setPct] = useState(50)
  const [trades, setTrades] = useState<Trade[]>([])
  const finished = useRef(false)
  const lastAction = useRef<number | null>(null)
  const firstRound = useRef(getRecords().length === 0)

  const finish = (stoppedOut: boolean) => {
    if (finished.current) return
    finished.current = true
    const final = close(acc, pair, mid)
    const allTrades = acc.position ? [...trades, { index, side: 'close' as const }] : trades
    onFinish({
      scenario,
      series,
      trades: allTrades,
      finalBalance: final.balance,
      record: {
        scenarioId: scenario.id,
        leverage,
        returnPct: ((final.balance - START_BALANCE) / START_BALANCE) * 100,
        stoppedOut,
        at: Date.now(),
      },
    })
  }

  useEffect(() => {
    if (finished.current) return
    if (shouldStopOut(acc, pair, mid)) finish(true)
    else if (done) finish(false)
  })

  const go = (side: Side) => {
    if (isTooSoon(lastAction.current, performance.now())) return
    const next = open(acc, pair, side, Math.floor((acc.balance * pct) / 100), leverage, mid)
    if (next === acc) return
    lastAction.current = performance.now()
    setAcc(next)
    setTrades(t => [...t, { index, side }])
  }
  const exit = () => {
    if (!acc.position || isTooSoon(lastAction.current, performance.now())) return
    lastAction.current = performance.now()
    setAcc(close(acc, pair, mid))
    setTrades(t => [...t, { index, side: 'close' }])
  }
  const quit = () => {
    pause()
    if (confirm('이 판을 그만두고 홈으로 갈까요? 기록은 남지 않아요.')) onQuit()
    else resume()
  }

  const change = ((mid - series.p[0]) / series.p[0]) * 100
  const eq = equity(acc, pair, mid)
  const level = marginLevel(acc, pair, mid)
  const pnl = acc.position ? unrealizedPnl(pair, acc.position, mid) : 0
  const remain = Math.max(0, ROUND_SECONDS - elapsedMs / 1000)
  const date = new Date(series.t[index] * 1000)
  const margin = Math.floor((acc.balance * pct) / 100)
  const showHint = firstRound.current && trades.length === 0

  return (
    <div className="screen">
      <div className="trade-head">
        <button className="x" aria-label="그만두기" onClick={quit}>✕</button>
        <span className="row-title">{scenario.title}</span>
        <span className={`badge ${leverage >= 10 ? 'hot' : ''}`}>{leverage}배</span>
      </div>

      <div>
        <div className="muted small">{PAIR_LABEL[pair]} · {date.getUTCFullYear()}.{date.getUTCMonth() + 1}.{date.getUTCDate()}</div>
        <p className="price num">{fmtPrice(pair, mid)}</p>
        <div className={`num ${change >= 0 ? 'up' : 'down'}`}>{change >= 0 ? '▲' : '▼'} {fmtPct(change)}</div>
      </div>

      <PriceChart series={series} upTo={index} trades={trades} />

      <div className="progress"><div style={{ width: `${(elapsedMs / (ROUND_SECONDS * 1000)) * 100}%` }} /></div>

      <div className="meta">
        <div className="meta-col"><span>자산</span><b className="num">{fmtUsd(eq)}</b></div>
        <div className="meta-col" style={{ textAlign: 'center' }}>
          <span>증거금 유지율 <InfoButton term="marginLevel" /></span>
          <b className={`num ${level !== null && level < 100 ? 'down' : ''}`}>{level === null ? '—' : `${Math.round(level)}%`}</b>
        </div>
        <div className="meta-col" style={{ textAlign: 'right' }}><span>남은 시간</span><b className="num">{Math.floor(remain / 60)}:{String(Math.floor(remain % 60)).padStart(2, '0')}</b></div>
      </div>

      {acc.position ? (
        <div className="pos">
          <div>
            <div className="muted small">{acc.position.side === 'buy' ? '매수' : '매도'} · 증거금 {fmtUsd(acc.position.margin)} <InfoButton term="margin" /></div>
            <b className={`num ${pnl >= 0 ? 'up' : 'down'}`}>{pnl >= 0 ? '+' : ''}{fmtUsd(pnl)}</b>
          </div>
          <div className="muted small num">진입 {fmtPrice(pair, acc.position.entry)}</div>
        </div>
      ) : (
        <div className="slider">
          <div className="meta small"><span className="muted">증거금 <InfoButton term="margin" /></span><span className="num">{fmtUsd(margin)} → 거래 {fmtUsd(margin * leverage)}</span></div>
          <input type="range" min={10} max={100} step={10} value={pct} onChange={e => setPct(Number(e.target.value))} aria-label="증거금 비율" />
        </div>
      )}

      <div className="actions">
        {showHint && <div className="hint">오를 것 같으면 매수, 내릴 것 같으면 매도</div>}
        {acc.position ? (
          <button className="btn primary" onClick={exit}>청산하기</button>
        ) : (
          <>
            <button className="btn buy" disabled={margin <= 0} onClick={() => go('buy')}>매수</button>
            <button className="btn sell" disabled={margin <= 0} onClick={() => go('sell')}>매도</button>
          </>
        )}
      </div>
      <div className="muted small" style={{ textAlign: 'center' }}>스프레드 <InfoButton term="spread" /> · 매수/매도 <InfoButton term="buySell" /></div>

      {paused && !done && (
        <div className="overlay">
          <b style={{ fontSize: 22 }}>일시정지됨</b>
          <p className="muted">앱을 벗어나서 시간을 멈춰뒀어요.</p>
          <button className="btn primary wide" onClick={resume}>계속하기</button>
        </div>
      )}
    </div>
  )
}
