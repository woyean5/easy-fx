import { useCallback, useEffect, useRef, useState } from 'react'
import type { PriceSeries } from '../scenarios/load'
import { indexAt, ROUND_SECONDS } from './replay'

/** 테스트·데모용 배속: ?speed=60 이면 5초에 한 판 */
function speedFromUrl(): number {
  const v = Number(new URLSearchParams(location.search).get('speed'))
  return v > 0 ? v : 1
}

export function useReplay(series: PriceSeries | null) {
  const [elapsedMs, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const last = useRef<number | null>(null)
  const speed = useRef(speedFromUrl())

  const total = ROUND_SECONDS * 1000
  const done = elapsedMs >= total

  useEffect(() => {
    if (!series || paused || done) { last.current = null; return }
    let raf = 0
    const tick = (now: number) => {
      if (last.current !== null) setElapsed(e => Math.min(total, e + (now - last.current!) * speed.current))
      last.current = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [series, paused, done, total])

  useEffect(() => {
    const onHide = () => { if (document.hidden) setPaused(true) }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  const index = series ? indexAt(elapsedMs, series.p.length) : 0
  const mid = series ? series.p[index] : 0
  const pause = useCallback(() => setPaused(true), [])
  const resume = useCallback(() => setPaused(false), [])
  return { index, mid, elapsedMs, done, paused, pause, resume }
}
