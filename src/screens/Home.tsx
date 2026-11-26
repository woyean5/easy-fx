import { useState } from 'react'
import { SCENARIOS, type Scenario } from '../scenarios/catalog'
import { bestReturn, getNickname, getRecords, isGuideDone } from '../storage/storage'
import { LeveragePicker } from '../components/LeveragePicker'
import { PAIR_LABEL, fmtPct } from './types'

interface Props {
  onStart: (scenario: Scenario, leverage: number) => void
  onOpenGuide: () => void
  onEditNickname: () => void
}

/** 연습 탭: 실제 과거 사건을 5분에 재생하는 시나리오 목록 */
export function Home({ onStart, onOpenGuide, onEditNickname }: Props) {
  const [picking, setPicking] = useState<Scenario | null>(null)
  const records = getRecords()
  const stopOuts = records.filter(r => r.stoppedOut).length
  const guideDone = isGuideDone()

  return (
    <div className="screen tabbed">
      <header className="large-title">
        <div className="title-row">
          <h1>연습</h1>
          <button className="link" onClick={onEditNickname}>{getNickname() ?? '닉네임'}</button>
        </div>
        <div className="subtitle">실제 과거 환율 한 달을 5분에</div>
      </header>

      {!guideDone && (
        <button className="card guide-banner" onClick={onOpenGuide}>
          <b>처음이세요? 입문 가이드 (2분)</b>
          <div className="muted small">다 읽으면 10배·30배 레버리지가 열려요</div>
        </button>
      )}

      <section>
        <h2 className="section-title">시나리오</h2>
        <div className="watchlist">
          {SCENARIOS.map(s => {
            const best = bestReturn(s.id)
            return (
              <button key={s.id} className="watch-row" onClick={() => setPicking(s)}>
                <div className="watch-name">
                  <b>{s.title}</b>
                  <span>{PAIR_LABEL[s.pair]} · {s.from.slice(0, 7).replace('-', '.')} · {s.teaser}</span>
                </div>
                <div className="watch-right">
                  <span className={`pill num ${best === null ? '' : best >= 0 ? 'up' : 'down'}`}>{best === null ? '도전' : fmtPct(best)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <div className="stats">
        <div className="stat"><span className="muted small">플레이</span><b className="num">{records.length}판</b></div>
        <div className="stat"><span className="muted small">강제청산</span><b className="num">{stopOuts}번</b></div>
      </div>

      {guideDone && <button className="link" onClick={onOpenGuide}>입문 가이드 다시 보기</button>}

      {picking && (
        <LeveragePicker
          guideDone={guideDone}
          onCancel={() => setPicking(null)}
          onOpenGuide={() => { setPicking(null); onOpenGuide() }}
          onPick={l => { const s = picking; setPicking(null); onStart(s, l) }}
        />
      )}
    </div>
  )
}
