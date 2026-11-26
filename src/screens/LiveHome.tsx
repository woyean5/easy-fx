import { START_BALANCE } from '../engine/engine'
import { liveEquity, liveMarginLevel, livePnl, usedMargin } from '../live/account'
import { LIVE_PAIRS, PAIR_NAME_KO, type LivePair } from '../live/quotes'
import type { LiveApi } from '../live/useLive'
import { Sparkline } from '../components/Sparkline'
import { InfoButton } from '../guide/InfoButton'
import { fmtPct, fmtPrice, fmtUsd, PAIR_LABEL } from './types'

export function LiveHome({ live, onOpen }: { live: LiveApi; onOpen: (p: LivePair) => void }) {
  const { acc, mids, offline } = live
  const eq = liveEquity(acc, mids)
  const ret = ((eq - START_BALANCE) / START_BALANCE) * 100
  const level = liveMarginLevel(acc, mids)
  const held = LIVE_PAIRS.filter(p => acc.positions[p])
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

  return (
    <div className="screen tabbed">
      <header className="large-title">
        <h1>Easy FX</h1>
        <div className="subtitle">{today}</div>
      </header>

      {offline && <div className="banner">시세 연결이 끊겼어요. 다시 연결하는 중…</div>}

      <section className="card account">
        <div className="muted small">실시간 계좌 자산</div>
        <div className="account-row">
          <b className="num account-eq">{fmtUsd(eq)}</b>
          <span className={`pill num ${Math.abs(ret) < 0.005 ? 'flat' : ret > 0 ? 'up' : 'down'}`}>{fmtPct(ret)}</span>
        </div>
        <div className="account-sub small muted num">
          <span>사용 증거금 {fmtUsd(usedMargin(acc))}</span>
          <span>유지율 {level === null ? '—' : `${Math.round(level)}%`} <InfoButton term="marginLevel" /></span>
        </div>
      </section>

      {held.length > 0 && (
        <section>
          <h2 className="section-title">보유 중</h2>
          <div className="group">
            {held.map(p => {
              const pos = acc.positions[p]!
              const pnl = livePnl(p, pos, mids)
              return (
                <button key={p} className="cell" onClick={() => onOpen(p)}>
                  <div className="cell-main">
                    <b>{PAIR_LABEL[p]}</b>
                    <span className="muted small">{pos.side === 'buy' ? '매수' : '매도'} · {pos.leverage}배 · 증거금 {fmtUsd(pos.margin)}</span>
                  </div>
                  <b className={`num ${pnl >= 0 ? 'up' : 'down'}`}>{pnl >= 0 ? '+' : ''}{fmtUsd(pnl)}</b>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">통화</h2>
        <div className="watchlist">
          {LIVE_PAIRS.map(p => {
            const i = live.info(p)
            const chg = i.mid !== undefined && i.prev ? ((i.mid - i.prev) / i.prev) * 100 : null
            return (
              <button key={p} className="watch-row" onClick={() => onOpen(p)}>
                <div className="watch-name">
                  <b>{PAIR_LABEL[p]}</b>
                  <span>{PAIR_NAME_KO[p]}{i.stale ? ' · 휴장' : ''}</span>
                </div>
                <Sparkline values={i.spark} base={i.prev} />
                <div className="watch-right">
                  <span className="num watch-price">{i.mid === undefined ? '—' : fmtPrice(p, i.mid)}</span>
                  <span className={`pill num ${chg === null ? '' : chg >= 0 ? 'up' : 'down'}`}>{chg === null ? '—' : fmtPct(chg)}</span>
                </div>
              </button>
            )
          })}
        </div>
        <p className="footnote">시세: Kraken(유로·파운드·호주달러, 3초), Coinbase(엔·원, 1분). 모의투자 앱이며 투자 권유가 아닙니다.</p>
      </section>
    </div>
  )
}
