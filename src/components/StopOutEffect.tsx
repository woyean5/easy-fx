import { useEffect, useState } from 'react'
import { START_BALANCE } from '../engine/engine'
import { fmtUsd } from '../screens/types'
import { lowerLeverage, stopOutMessage } from './stopOut'

interface Props {
  leverage: number
  finalBalance: number
  onRetryLower: () => void
  onClose: () => void
}

export function StopOutEffect({ leverage, finalBalance, onRetryLower, onClose }: Props) {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(reduced ? finalBalance : START_BALANCE)

  useEffect(() => {
    if (reduced) return
    navigator.vibrate?.([200, 100, 200])
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 1000)
      setShown(START_BALANCE + (finalBalance - START_BALANCE) * (1 - (1 - k) ** 3))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [finalBalance, reduced])

  const lower = lowerLeverage(leverage)
  return (
    <div className={`stopout ${reduced ? '' : 'anim'}`} role="alertdialog" aria-label="강제청산">
      <div className="flash" />
      <h1>강제청산 (Margin Call)</h1>
      <div className="num down">{fmtUsd(shown)}</div>
      <p>{stopOutMessage(leverage)}</p>
      {lower < leverage && <button className="btn primary" onClick={onRetryLower}>{lower}배로 다시 하기</button>}
      <button className="btn" onClick={onClose}>결과 보기</button>
    </div>
  )
}
