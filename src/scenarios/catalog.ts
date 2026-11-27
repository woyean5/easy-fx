import type { Pair } from '../engine/types'

export interface Scenario {
  id: string
  /** historic: 과거 사건(파일 데이터), recent: 최근 30일(Kraken 1시간봉, 실행 시 받아옴) */
  kind: 'historic' | 'recent'
  title: string
  pair: Pair
  from: string
  to: string
  teaser: string
  story: string[]
}

const recent = (pair: 'EURUSD' | 'GBPUSD' | 'AUDUSD' | 'USDCAD', name: string): Scenario => ({
  id: `recent-${pair.toLowerCase()}`,
  kind: 'recent',
  title: `최근 한 달 ${name}`,
  pair,
  from: '',
  to: '',
  teaser: '지난 30일 실제 시세 · 1시간 단위',
  story: [],
})

export const RECENT_SCENARIOS: Scenario[] = [recent('EURUSD', '유로/달러'), recent('GBPUSD', '파운드/달러'), recent('AUDUSD', '호주달러/달러'), recent('USDCAD', '달러/캐나다달러')]

export const HISTORIC_SCENARIOS: Scenario[] = [
  {
    id: 'yen-crash-2022',
    kind: 'historic',
    title: '엔화 대폭락',
    pair: 'USDJPY',
    from: '2022-09-01',
    to: '2022-10-31',
    teaser: '달러당 140엔에서 150엔을 넘기까지',
    story: [
      '미국은 물가를 잡으려고 금리를 빠르게 올렸지만, 일본은 초저금리를 유지했어요.',
      '금리 차이가 벌어지자 돈이 엔화에서 달러로 몰렸고, 달러/엔은 32년 만에 150엔을 넘었어요.',
      '9월 22일 일본 정부가 1998년 이후 처음으로 엔화를 사들이는 개입을 했고, 환율이 몇 시간 만에 5엔 가까이 떨어졌어요.',
      '10월 21일 152엔 근처에서 다시 개입이 나왔어요. 방향이 맞아도 레버리지가 높으면 이런 급락 한 번에 청산될 수 있어요.',
    ],
  },
  {
    id: 'covid-dollar-2020',
    kind: 'historic',
    title: '코로나 달러 쇼크',
    pair: 'EURUSD',
    from: '2020-03-01',
    to: '2020-03-31',
    teaser: '위기가 오면 돈은 어디로 갈까',
    story: [
      '3월 초에는 미국 금리 인하 기대로 달러가 약해져서 유로/달러가 1.14 위로 올랐어요.',
      '전 세계가 봉쇄되자 기업과 투자자가 앞다퉈 현금 달러를 구하면서 흐름이 정반대로 뒤집혔어요.',
      '2주 만에 유로/달러는 1.07 아래로 떨어졌어요. 위기 때 달러로 돈이 몰리는 현상이에요.',
      '3월 23일 미국 연준이 무제한 양적완화를 발표하자 달러 쏠림이 진정되기 시작했어요.',
    ],
  },
  {
    id: 'brexit-2016',
    kind: 'historic',
    title: '브렉시트의 밤',
    pair: 'GBPUSD',
    from: '2016-06-15',
    to: '2016-07-15',
    teaser: '개표 하룻밤에 무너진 파운드',
    story: [
      '6월 23일 영국은 유럽연합 탈퇴 여부를 국민투표로 정했어요.',
      '시장은 잔류를 예상해 파운드/달러가 1.50 가까이 올랐지만, 개표가 진행되며 탈퇴 쪽으로 기울었어요.',
      '하룻밤 사이 파운드/달러는 1.32대까지 떨어졌어요. 1985년 이후 가장 낮은 수준이었어요.',
      '결과가 정해지지 않은 이벤트 직전에 큰 레버리지로 한쪽에 거는 건 동전 던지기와 비슷해요.',
    ],
  },
  {
    id: 'carry-unwind-2024',
    kind: 'historic',
    title: '엔캐리 청산',
    pair: 'USDJPY',
    from: '2024-07-15',
    to: '2024-08-15',
    teaser: '모두가 같은 쪽에 서 있을 때',
    story: [
      '많은 투자자가 이자가 거의 없는 엔화를 빌려 다른 자산에 투자하는 "엔캐리 트레이드"를 하고 있었어요.',
      '7월 31일 일본은행이 금리를 올리고 미국 경기 둔화 우려가 겹치자, 빌린 엔화를 갚으려는 매수가 한꺼번에 몰렸어요.',
      '달러/엔은 158엔대에서 8월 5일 142엔 근처까지 떨어졌고, 같은 날 일본 닛케이 지수는 12% 넘게 폭락했어요.',
      '모두가 같은 방향에 있을 때 되돌림은 훨씬 빠르고 크게 와요.',
    ],
  },
]

export const SCENARIOS: Scenario[] = [...RECENT_SCENARIOS, ...HISTORIC_SCENARIOS]
