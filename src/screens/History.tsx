import { START_BALANCE } from '../engine/engine'
import { liveEquity } from '../live/account'
import type { LiveApi } from '../live/useLive'
import { SCENARIOS } from '../scenarios/catalog'
import { getLiveHistory, getRecords } from '../storage/storage'
import { fmtPct, fmtUsd, PAIR_LABEL, trendClass } from './types'

const when = (sec: number) => new Date(sec * 1000).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export function History({ live }: { live: LiveApi }) {
  const trades = [...getLiveHistory()].reverse()
  const records = [...getRecords()].reverse()
  const eq = liveEquity(live.acc, live.mids)
  const wins = trades.filter(t => t.pnl > 0).length

  const reset = () => {
    if (confirm('실시간 계좌를 $10,000로 초기화할까요? 실시간 거래 기록도 모두 지워져요.')) live.reset()
  }

  return (
    <div className="screen tabbed">
      <header className="large-title"><h1>기록</h1></header>

      <section className="card account">
        <div className="muted small">실시간 계좌</div>
        <div className="account-row">
          <b className="num account-eq">{fmtUsd(eq)}</b>
          <span className={`pill num ${trendClass(((eq - START_BALANCE) / START_BALANCE) * 100)}`}>{fmtPct(((eq - START_BALANCE) / START_BALANCE) * 100)}</span>
        </div>
        <div className="account-sub small muted num">
          <span>거래 {trades.length}번 · 수익 {wins}번</span>
          <span>강제청산 {trades.filter(t => t.reason === 'stopout').length}번</span>
        </div>
        <button className="btn wide danger" style={{ marginTop: 12 }} onClick={reset}>계좌 초기화</button>
      </section>

      <section>
        <h2 className="section-title">실시간 거래</h2>
        {trades.length === 0 ? <p className="muted small">아직 청산한 거래가 없어요.</p> : (
          <div className="group">
            {trades.map((t, i) => (
              <div key={i} className="cell static">
                <div className="cell-main">
                  <b>{PAIR_LABEL[t.pair]} {t.side === 'buy' ? '매수' : '매도'} {t.leverage}배{t.reason === 'stopout' && <span className="tag">강제청산</span>}</b>
                  <span className="muted small">{when(t.closedAt)} · 증거금 {fmtUsd(t.margin)}</span>
                </div>
                <b className={`num ${t.pnl >= 0 ? 'up' : 'down'}`}>{t.pnl >= 0 ? '+' : ''}{fmtUsd(t.pnl)}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">연습 기록</h2>
        {records.length === 0 ? <p className="muted small">아직 연습한 판이 없어요.</p> : (
          <div className="group">
            {records.map((r, i) => (
              <div key={i} className="cell static">
                <div className="cell-main">
                  <b>{SCENARIOS.find(s => s.id === r.scenarioId)?.title ?? r.scenarioId} · {r.leverage}배{r.stoppedOut && <span className="tag">강제청산</span>}</b>
                  <span className="muted small">{when(r.at / 1000)}</span>
                </div>
                <b className={`num ${r.returnPct >= 0 ? 'up' : 'down'}`}>{fmtPct(r.returnPct)}</b>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
