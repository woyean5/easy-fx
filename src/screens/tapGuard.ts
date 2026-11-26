// 매수 버튼 자리에 청산 버튼이 바로 나타나므로, 빠른 두 번째 탭이 청산으로 이어지지 않게 막는다.
export const TAP_GUARD_MS = 500

export function isTooSoon(lastActionAt: number | null, now: number): boolean {
  return lastActionAt !== null && now - lastActionAt < TAP_GUARD_MS
}
