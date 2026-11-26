import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts'

export interface Point { t: number; p: number }

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** 손가락으로 훑으면 onHover로 그 시점 값을 알려주는 선 차트 */
export function LiveChart({ points, onHover, height = 260 }: { points: Point[]; onHover: (p: Point | null) => void; height?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const chart = useRef<IChartApi | null>(null)
  const area = useRef<ISeriesApi<'Area'> | null>(null)
  const hover = useRef(onHover)
  hover.current = onHover

  useEffect(() => {
    if (!box.current) return
    const c = createChart(box.current, {
      height,
      layout: { background: { color: 'transparent' }, textColor: css('--muted'), attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      timeScale: { borderVisible: false, visible: false },
      crosshair: {
        mode: 1,
        vertLine: { color: css('--muted'), width: 1, style: 0, labelVisible: false },
        horzLine: { visible: false, labelVisible: false },
      },
      handleScroll: false,
      handleScale: false,
    })
    area.current = c.addAreaSeries({ lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerRadius: 5 })
    c.subscribeCrosshairMove(param => {
      const d = param.time !== undefined ? param.seriesData.get(area.current!) as { value: number } | undefined : undefined
      hover.current(d ? { t: param.time as number, p: d.value } : null)
    })
    chart.current = c
    const ro = new ResizeObserver(() => c.applyOptions({ width: box.current!.clientWidth }))
    ro.observe(box.current)
    return () => { ro.disconnect(); c.remove() }
  }, [height])

  useEffect(() => {
    const s = area.current
    if (!s) return
    // 시간이 겹치면 차트 라이브러리가 오류를 내므로 정리한다
    const clean: Point[] = []
    for (const pt of [...points].sort((a, b) => a.t - b.t)) {
      if (clean.length && clean[clean.length - 1].t === pt.t) clean[clean.length - 1] = pt
      else clean.push(pt)
    }
    s.setData(clean.map(pt => ({ time: pt.t as UTCTimestamp, value: pt.p })))
    const up = clean.length < 2 || clean[clean.length - 1].p >= clean[0].p
    const color = up ? css('--up') : css('--down')
    s.applyOptions({ lineColor: color, topColor: color + '40', bottomColor: color + '00', crosshairMarkerBackgroundColor: color })
    chart.current?.timeScale().fitContent()
  }, [points])

  return <div ref={box} className="chart" style={{ height }} />
}
