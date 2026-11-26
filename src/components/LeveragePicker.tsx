import { LEVERAGES, LOCKED_LEVERAGES } from './stopOut'
import { InfoButton } from '../guide/InfoButton'

interface Props {
  guideDone: boolean
  onPick: (leverage: number) => void
  onOpenGuide: () => void
  onCancel: () => void
}

export function LeveragePicker({ guideDone, onPick, onOpenGuide, onCancel }: Props) {
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">레버리지 고르기 <InfoButton term="leverage" /></h2>
        <div className="lev-grid">
          {LEVERAGES.map(l => {
            const locked = !guideDone && LOCKED_LEVERAGES.includes(l)
            return (
              <button
                key={l}
                className={`lev ${locked ? 'locked' : ''} ${l >= 10 ? 'hot' : ''}`}
                aria-disabled={locked ? 'true' : 'false'}
                onClick={() => (locked ? onOpenGuide() : onPick(l))}
              >
                {l}배{locked && <span className="lock"> 🔒</span>}
              </button>
            )
          })}
        </div>
        {!guideDone && <p className="muted small">입문 가이드를 다 읽으면 10배·30배가 열려요.</p>}
      </div>
    </div>
  )
}
