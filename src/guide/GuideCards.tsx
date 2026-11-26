import { useState } from 'react'
import { GUIDE_CARDS } from './glossary'
import { setGuideDone } from '../storage/storage'

export function GuideCards({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const last = i === GUIDE_CARDS.length - 1
  const card = GUIDE_CARDS[i]
  return (
    <div className="guide">
      <div className="trade-head">
        <button className="x" aria-label="닫기" onClick={onClose}>✕</button>
        <div className="dots">{GUIDE_CARDS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
        <span style={{ width: 32 }} />
      </div>
      <h2>{card.title}</h2>
      <p>{card.body}</p>
      <div className="actions">
        {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>이전</button>}
        <button
          className="btn primary"
          onClick={() => { if (last) { setGuideDone(); onClose() } else setI(i + 1) }}
        >
          {last ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  )
}
