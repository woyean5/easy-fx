import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, type ISeriesApi, type SeriesMarker, type UTCTimestamp, type Time } from 'lightweight-charts'
import type { PriceSeries } from '../scenarios/load'
import type { Trade } from '../screens/types'

interface Props {
  series: PriceSeries
  /** 이 인덱스까지 그린다 */
  upTo: number
  trades?: Trade[]
  height?: number
}

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export function PriceChart({ series, upTo, trades = [], height = 240 }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const chart = useRef<IChartApi | null>(null)
  const line = useRef<ISeriesApi<'Area'> | null>(null)
  const drawn = useRef(-1)

  useEffect(() => {
    if (!box.current) return
    const c = createChart(box.current, {
      height,
      layout: { background: { color: 'transparent' }, textColor: css('--muted'), attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: css('--line') } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, visible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    })
    chart.current = c
    line.current = c.addAreaSeries({ lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
    drawn.current = -1
    const ro = new ResizeObserver(() => c.applyOptions({ width: box.current!.clientWidth }))
    ro.observe(box.current)
    return () => { ro.disconnect(); c.remove() }
  }, [series, height])

  useEffect(() => {
    const s = line.current
    if (!s) return
    const pt = (i: number) => ({ time: series.t[i] as UTCTimestamp, value: series.p[i] })
    if (upTo < drawn.current || drawn.current < 0) {
      s.setData(Array.from({ length: upTo + 1 }, (_, i) => pt(i)))
    } else {
      for (let i = drawn.current + 1; i <= upTo; i++) s.update(pt(i))
    }
    drawn.current = upTo
    const color = series.p[upTo] >= series.p[0] ? css('--up') : css('--down')
    s.applyOptions({ lineColor: color, topColor: color + '55', bottomColor: color + '00' })
    chart.current?.timeScale().fitContent()
  }, [series, upTo])

  useEffect(() => {
    const markers: SeriesMarker<Time>[] = trades
      .filter(t => t.index <= upTo)
      .map(t => ({
        time: series.t[t.index] as UTCTimestamp,
        position: t.side === 'sell' ? 'aboveBar' : 'belowBar',
        shape: t.side === 'buy' ? 'arrowUp' : t.side === 'sell' ? 'arrowDown' : 'circle',
        color: t.side === 'buy' ? css('--up') : t.side === 'sell' ? css('--down') : css('--muted'),
        text: t.side === 'buy' ? '매수' : t.side === 'sell' ? '매도' : '청산',
      }))
    line.current?.setMarkers(markers)
  }, [trades, upTo, series])

  return <div ref={box} className="chart" style={{ height }} />
}
