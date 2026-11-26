export const LEVERAGES = [1, 2, 3, 10, 30] as const
export const LOCKED_LEVERAGES = [10, 30]

export function stopOutMessage(leverage: number): string {
  return `레버리지 ${leverage}배에서는 ${(100 / leverage).toFixed(1)}%만 반대로 움직여도 원금이 사라져요`
}

export function lowerLeverage(leverage: number): number {
  const lower = LEVERAGES.filter(l => l < leverage)
  return lower.length ? lower[lower.length - 1] : LEVERAGES[0]
}
