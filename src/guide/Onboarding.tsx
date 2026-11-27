import { useState } from 'react'
import { setOnboarded } from '../storage/storage'

type Choice = 'guide' | 'start'

const SLIDES: { icon: string; color: string; title: string; body: string }[] = [
  {
    icon: 'M3 17l5-6 4 4 8-9M15 6h5v5',
    color: 'var(--up)',
    title: 'Easy FX에 오신 걸 환영해요',
    body: '가상의 $10,000로 진짜 환율에 투자해 보는 FX 모의투자 앱이에요. 실제 돈은 한 푼도 쓰지 않아요.',
  },
  {
    icon: 'M4 6h16M4 12h16M4 18h10',
    color: 'var(--accent)',
    title: '실시간: 지금 시세로 거래',
    body: '달러/원, 달러/엔, 유로/달러 같은 통화를 눌러 차트를 보고, 오를 것 같으면 매수, 내릴 것 같으면 매도해요. 계좌는 앱을 닫아도 그대로 남아요.',
  },
  {
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
    color: '#ff9f0a',
    title: '연습: 과거 한 달을 5분에',
    body: '엔화 대폭락, 브렉시트처럼 실제로 있었던 사건의 환율을 빠르게 돌려요. 끝나면 그때 무슨 일이 있었는지 알려드려요.',
  },
  {
    icon: 'M12 3l9 16H3L12 3zM12 10v4M12 17h.01',
    color: 'var(--down)',
    title: '레버리지는 양날의 검',
    body: '레버리지를 높이면 수익도 손실도 그만큼 커져요. 손실이 커져 증거금 유지율이 50% 아래로 떨어지면 강제청산돼요. 모르는 용어는 ⓘ를 누르면 설명이 나와요.',
  },
]

export function Onboarding({ onDone }: { onDone: (choice: Choice) => void }) {
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1
  const s = SLIDES[i]
  const finish = (c: Choice) => { setOnboarded(); onDone(c) }

  return (
    <div className="onboarding" role="dialog" aria-label="Easy FX 소개">
      <div className="onb-top">
        <span />
        {!last && <button className="link" onClick={() => finish('start')}>건너뛰기</button>}
      </div>
      <div className="onb-body" key={i}>
        <div className="onb-icon" style={{ color: s.color }}>
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
        </div>
        <h1>{s.title}</h1>
        <p>{s.body}</p>
      </div>
      <div className="dots">{SLIDES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      <div className="onb-actions">
        {last ? (
          <>
            <button className="btn primary wide" onClick={() => finish('guide')}>입문 가이드 보기 (2분)</button>
            <button className="btn wide" onClick={() => finish('start')}>바로 시작</button>
            <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>가이드를 다 읽으면 10배·30배 레버리지가 열려요</p>
          </>
        ) : (
          <button className="btn primary wide" onClick={() => setI(i + 1)}>다음</button>
        )}
      </div>
    </div>
  )
}
