export const ROUND_SECONDS = 300

export function indexAt(elapsedMs: number, length: number): number {
  if (length <= 1) return 0
  const i = Math.floor((elapsedMs / (ROUND_SECONDS * 1000)) * (length - 1))
  return Math.max(0, Math.min(length - 1, i))
}
