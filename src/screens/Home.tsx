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

export function Home({ onStart, onOpenGuide, onEditNickname }: Props) {
  const [picking, setPicking] = useState<Scenario | null>(null)
  const records = getRecords()
  const stopOuts = records.filter(r => r.stoppedOut).length
  const guideDone = isGuideDone()

  return (
    <div className="screen">
      <div className="top">
        <h1 className="brand">Easy FX</h1>
        <button className="link" onClick={onEditNickname}>{getNickname() ?? '닉네임'}</button>
      </div>

      {!guideDone && (
        <button className="guide-banner" onClick={onOpenGuide}>
          <b>처음이세요? 입문 가이드 (2분)</b>
          <div className="muted small">다 읽으면 10배·30배 레버리지가 열려요</div>
        </button>
      )}

      <div>
        <div className="muted small">시나리오 · 실제 과거 환율 한 달을 5분에</div>
        <div className="list">
          {SCENARIOS.map(s => {
            const best = bestReturn(s.id)
            return (
              <button key={s.id} className="row" onClick={() => setPicking(s)}>
                <div>
                  <div className="row-title">{s.title}</div>
                  <div className="row-sub">{PAIR_LABEL[s.pair]} · {s.from.slice(0, 7).replace('-', '.')} · {s.teaser}</div>
                </div>
                <div className={`pill num ${best === null ? '' : best >= 0 ? 'up' : 'down'}`}>
                  {best === null ? '도전' : fmtPct(best)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span className="muted small">플레이</span><b className="num">{records.length}판</b></div>
        <div className="stat"><span className="muted small">강제청산</span><b className="num">{stopOuts}번</b></div>
      </div>

      {guideDone && <button className="link" onClick={onOpenGuide}>입문 가이드 다시 보기</button>}
      <p className="disclaimer">모의투자 앱이며 투자 권유가 아닙니다.</p>

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
