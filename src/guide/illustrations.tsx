import type { ReactNode } from 'react'

/** 입문 가이드 카드용 그림. 색은 테마 변수를 써서 다크/라이트 모두 맞춘다 */
function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg className="guide-art" viewBox="0 0 320 180" role="img" aria-label={label}>
      <rect x="0" y="0" width="320" height="180" rx="18" fill="var(--group)" />
      {children}
    </svg>
  )
}

const T = (p: { x: number; y: number; s?: number; c?: string; w?: number; a?: 'start' | 'middle' | 'end'; children: ReactNode }) => (
  <text x={p.x} y={p.y} fontSize={p.s ?? 13} fill={p.c ?? 'var(--text)'} fontWeight={p.w ?? 600} textAnchor={p.a ?? 'middle'}>{p.children}</text>
)

function Coin({ x, sym, color }: { x: number; sym: string; color: string }) {
  return (
    <g>
      <circle cx={x} cy={78} r={38} fill={color} opacity={0.18} />
      <circle cx={x} cy={78} r={38} fill="none" stroke={color} strokeWidth={3} />
      <T x={x} y={92} s={38} w={800} c={color}>{sym}</T>
    </g>
  )
}

export function ArtFx() {
  return (
    <Frame label="1달러를 원화로 바꾸면 약 1,350원. 이 교환 비율이 환율이에요">
      <Coin x={80} sym="$" color="var(--up)" />
      <Coin x={240} sym="₩" color="var(--accent)" />
      <path d="M128 66 H192 M184 58 L194 66 L184 74" fill="none" stroke="var(--muted)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M192 92 H128 M136 84 L126 92 L136 100" fill="none" stroke="var(--muted)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <T x={160} y={150} s={15}>1달러 = 1,350원</T>
      <T x={160} y={168} s={11} c="var(--muted)" w={500}>이 비율(환율)이 매일 바뀌어요</T>
    </Frame>
  )
}

export function ArtBuySell() {
  return (
    <Frame label="매수는 오르면 이익, 매도는 내리면 이익">
      <polyline points="24,120 56,104 80,112 112,76 136,84 148,56" fill="none" stroke="var(--up)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={148} cy={56} r={5} fill="var(--up)" />
      <T x={86} y={150} c="var(--up)" s={15} w={800}>매수</T>
      <T x={86} y={168} s={11} c="var(--muted)" w={500}>오르면 이익</T>
      <line x1={160} y1={30} x2={160} y2={160} stroke="var(--line)" strokeWidth={1} />
      <polyline points="172,56 196,72 220,64 248,100 272,92 296,124" fill="none" stroke="var(--down)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={296} cy={124} r={5} fill="var(--down)" />
      <T x={234} y={150} c="var(--down)" s={15} w={800}>매도</T>
      <T x={234} y={168} s={11} c="var(--muted)" w={500}>내리면 이익</T>
    </Frame>
  )
}

export function ArtSpread() {
  return (
    <Frame label="살 때 가격과 팔 때 가격의 차이가 스프레드예요">
      <rect x={40} y={34} width={150} height={40} rx={10} fill="var(--up)" opacity={0.18} />
      <T x={56} y={52} s={11} c="var(--muted)" w={500} a="start">살 때 (Ask)</T>
      <T x={56} y={68} s={16} w={800} a="start">1.10008</T>
      <rect x={40} y={98} width={150} height={40} rx={10} fill="var(--down)" opacity={0.18} />
      <T x={56} y={116} s={11} c="var(--muted)" w={500} a="start">팔 때 (Bid)</T>
      <T x={56} y={132} s={16} w={800} a="start">1.10000</T>
      <path d="M204 54 H220 V118 H204" fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinejoin="round" />
      <T x={232} y={82} s={15} w={800} c="var(--accent)" a="start">스프레드</T>
      <T x={232} y={100} s={12} c="var(--muted)" w={500} a="start">0.8핍 차이</T>
      <T x={160} y={166} s={11} c="var(--muted)" w={500}>사자마자 이만큼 손해에서 시작해요</T>
    </Frame>
  )
}

export function ArtLeverage() {
  return (
    <Frame label="100만 원에 레버리지 10배면 1,000만 원어치를 거래해요">
      <rect x={30} y={88} width={44} height={44} rx={8} fill="var(--accent)" />
      <T x={52} y={150} s={11} c="var(--muted)" w={500}>내 돈</T>
      <T x={52} y={166} s={12}>100만 원</T>
      <T x={112} y={116} s={20} w={800} c="var(--down)">×10</T>
      <rect x={150} y={24} width={140} height={108} rx={10} fill="var(--accent)" opacity={0.22} />
      <rect x={150} y={24} width={140} height={108} rx={10} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" />
      <T x={220} y={150} s={11} c="var(--muted)" w={500}>거래 금액</T>
      <T x={220} y={166} s={12}>1,000만 원</T>
      <T x={220} y={74} s={12} w={700}>환율 1% 움직이면</T>
      <T x={220} y={94} s={14} w={800} c="var(--down)">±10만 원</T>
      <T x={220} y={112} s={11} c="var(--muted)" w={500}>(내 돈의 10%)</T>
    </Frame>
  )
}

export function ArtMarginCall() {
  // 유지율 게이지: 0~200%, 50% 아래는 강제청산 구간
  const x = (pct: number) => 30 + (pct / 200) * 260
  return (
    <Frame label="증거금 유지율이 50% 아래로 떨어지면 강제청산돼요">
      <T x={160} y={30} s={14} w={800}>증거금 유지율</T>
      <rect x={30} y={72} width={260} height={22} rx={11} fill="var(--surface-2)" />
      <rect x={30} y={72} width={x(50) - 30} height={22} rx={11} fill="var(--down)" />
      <rect x={x(50)} y={72} width={x(130) - x(50)} height={22} fill="var(--up)" opacity={0.85} />
      <line x1={x(50)} y1={64} x2={x(50)} y2={102} stroke="var(--text)" strokeWidth={2} />
      <T x={x(50)} y={120} s={12} w={800} c="var(--down)">50%</T>
      <path d={`M${x(130)} 68 l-7 -10 h14 z`} fill="var(--text)" />
      <T x={x(130)} y={52} s={12} w={700}>지금 130%</T>
      <T x={x(18)} y={140} s={11} w={700} c="var(--down)">강제청산</T>
      <T x={160} y={164} s={11} c="var(--muted)" w={500}>손실이 커질수록 왼쪽으로 내려가요</T>
    </Frame>
  )
}

export function ArtRound() {
  return (
    <Frame label="실제 과거 30일의 환율을 5분 동안 빠르게 돌려요">
      <rect x={24} y={48} width={120} height={56} rx={10} fill="var(--surface-2)" />
      <T x={84} y={72} s={11} c="var(--muted)" w={500}>실제 시세</T>
      <T x={84} y={94} s={20} w={800}>30일</T>
      <path d="M152 76 H196 M188 68 L198 76 L188 84" fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={250} cy={76} r={34} fill="none" stroke="var(--up)" strokeWidth={4} />
      <path d="M250 76 V54 M250 76 L264 86" stroke="var(--up)" strokeWidth={4} strokeLinecap="round" />
      <rect x={244} y={34} width={12} height={6} rx={2} fill="var(--up)" />
      <T x={250} y={132} s={16} w={800} c="var(--up)">5분</T>
      <T x={160} y={164} s={11} c="var(--muted)" w={500}>끝나면 그때 무슨 일이 있었는지 알려드려요</T>
    </Frame>
  )
}

export const GUIDE_ART = [ArtFx, ArtBuySell, ArtSpread, ArtLeverage, ArtMarginCall, ArtRound]
