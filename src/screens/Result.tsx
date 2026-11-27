import { useState } from 'react'
import { PriceChart } from '../components/PriceChart'
import { StopOutEffect } from '../components/StopOutEffect'
import { lowerLeverage } from '../components/stopOut'
import { START_BALANCE } from '../engine/engine'
import { fmtPct, fmtUsd, PAIR_LABEL, type RoundResult } from './types'
import { summarize } from '../scenarios/recent'

interface Props {
  result: RoundResult
  onRetry: (leverage: number) => void
  onHome: () => void
}

export function Result({ result, onRetry, onHome }: Props) {
  const { scenario, series, record, trades, finalBalance } = result
  const [effect, setEffect] = useState(record.stoppedOut)
  const up = record.returnPct >= 0

  return (
    <div className="screen">
      <div className="trade-head">
        <span className="muted small">{scenario.title} · {PAIR_LABEL[scenario.pair]} · {record.leverage}배</span>
      </div>
      <div>
        <div className="muted small">{record.stoppedOut ? '강제청산으로 끝났어요' : trades.length === 0 ? '거래 없이 끝났어요' : '최종 수익률'}</div>
        <p className={`big num ${up ? 'up' : 'down'}`}>{fmtPct(record.returnPct)}</p>
        <div className="num">{fmtUsd(START_BALANCE)} → <b>{fmtUsd(finalBalance)}</b></div>
      </div>
      <PriceChart series={series} upTo={series.p.length - 1} trades={trades} height={180} />
      <div className="story">
        <b style={{ display: 'block', marginBottom: 8 }}>{scenario.kind === 'recent' ? '이 기간 실제 시세는' : '그때 실제로 무슨 일이 있었나'}</b>
        {(scenario.kind === 'recent' ? summarize(scenario.pair, series) : scenario.story).map((s, i) => <p key={i}>{s}</p>)}
      </div>
      <div className="actions">
        <button className="btn" onClick={onHome}>홈</button>
        <button className="btn primary" onClick={() => onRetry(record.leverage)}>다시 하기</button>
      </div>
      <p className="disclaimer">모의투자 앱이며 투자 권유가 아닙니다.</p>
      {effect && (
        <StopOutEffect
          leverage={record.leverage}
          finalBalance={finalBalance}
          onRetryLower={() => onRetry(lowerLeverage(record.leverage))}
          onClose={() => setEffect(false)}
        />
      )}
    </div>
  )
}
