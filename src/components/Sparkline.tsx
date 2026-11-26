/** 애플 주식 앱의 작은 추세선. 기준선(24시간 전 가격)은 점선 */
export function Sparkline({ values, base, width = 64, height = 32 }: { values: number[]; base?: number; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />
  const all = base === undefined ? values : [...values, base]
  const min = Math.min(...all), max = Math.max(...all)
  const span = max - min || 1
  const x = (i: number) => (i / (values.length - 1)) * width
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4)
  const up = values[values.length - 1] >= (base ?? values[0])
  return (
    <svg width={width} height={height} aria-hidden>
      {base !== undefined && <line x1={0} x2={width} y1={y(base)} y2={y(base)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="1 3" />}
      <polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={up ? 'var(--up)' : 'var(--down)'} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  )
}
