import { useEffect } from 'react'
import type { StopOutNotice } from '../live/useLive'
import { fmtUsd } from '../screens/types'
import { stopOutMessage } from './stopOut'

export function LiveStopOutNotice({ notice, onClose }: { notice: StopOutNotice; onClose: () => void }) {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const loss = notice.trades.reduce((s, t) => s + t.pnl, 0)
  const maxLev = Math.max(...notice.trades.map(t => t.leverage), 1)
  useEffect(() => { if (!reduced) navigator.vibrate?.([200, 100, 200]) }, [reduced])
  return (
    <div className={`stopout ${reduced ? '' : 'anim'}`} role="alertdialog" aria-label="강제청산">
      <div className="flash" />
      <h1>강제청산 (Margin Call)</h1>
      <div className="num down">{fmtUsd(loss)}</div>
      <p>
        {notice.offline
          ? `앱을 닫아둔 동안 ${new Date(notice.at * 1000).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}에 증거금 유지율이 50% 아래로 떨어져 모든 포지션이 정리됐어요.`
          : '증거금 유지율이 50% 아래로 떨어져 모든 포지션이 정리됐어요.'}
      </p>
      <p className="muted">{stopOutMessage(maxLev)}</p>
      <button className="btn" onClick={onClose}>확인</button>
    </div>
  )
}
