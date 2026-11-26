export interface PriceSeries {
  id: string
  /** unix 초 */
  t: number[]
  /** 15분봉 종가 */
  p: number[]
}

export function validateSeries(s: unknown): PriceSeries {
  const v = s as PriceSeries
  if (!v || typeof v.id !== 'string' || !Array.isArray(v.t) || !Array.isArray(v.p)) throw new Error('bad series shape')
  if (v.t.length === 0 || v.t.length !== v.p.length) throw new Error('bad series length')
  if (v.p.some(x => !(typeof x === 'number' && x > 0))) throw new Error('bad price')
  return v
}

export async function loadSeries(id: string): Promise<PriceSeries> {
  const res = await fetch(`${import.meta.env.BASE_URL}scenarios/${id}.json`)
  if (!res.ok) throw new Error(`scenario ${id}: ${res.status}`)
  return validateSeries(await res.json())
}
