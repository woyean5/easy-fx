export type Term = 'leverage' | 'spread' | 'margin' | 'marginLevel' | 'stopOut' | 'pip' | 'buySell'

export const GLOSSARY: Record<Term, { title: string; body: string }> = {
  buySell: {
    title: '매수/매도 (Buy/Sell)',
    body: 'FX는 오를 것 같으면 매수, 내릴 것 같으면 매도로 시작해요. USD/JPY를 매수하면 "달러가 엔보다 강해질 것"에 거는 거예요. 매도로 시작하면 내릴 때 돈을 벌어요.',
  },
  pip: {
    title: '핍 (Pip)',
    body: '환율이 움직이는 가장 작은 단위예요. EUR/USD는 0.0001, USD/JPY는 0.01이 1핍이에요. 1.1000 → 1.1010이면 10핍 오른 거예요.',
  },
  spread: {
    title: '스프레드 (Spread)',
    body: '살 때 가격과 팔 때 가격의 차이예요. 거래하자마자 스프레드만큼 손해에서 시작해요. 자주 사고팔수록 이 비용이 쌓여요.',
  },
  leverage: {
    title: '레버리지 (Leverage)',
    body: '내 돈보다 큰 금액으로 거래하게 해주는 배율이에요. $1,000에 10배면 $10,000어치를 거래해요. 수익도 10배, 손실도 10배예요.',
  },
  margin: {
    title: '증거금 (Margin)',
    body: '포지션을 잡기 위해 맡겨두는 내 돈이에요. 거래 금액 ÷ 레버리지만큼 필요해요. $10,000를 10배로 거래하면 증거금은 $1,000예요.',
  },
  marginLevel: {
    title: '증거금 유지율 (Margin Level)',
    body: '지금 내 자산이 맡긴 증거금의 몇 %인지 보여줘요. 손실이 커질수록 내려가요. 50% 아래로 떨어지면 강제청산돼요.',
  },
  stopOut: {
    title: '강제청산 (Margin Call)',
    body: '손실이 너무 커지면 더 잃기 전에 자동으로 포지션이 정리돼요. 레버리지가 높을수록 아주 작은 움직임에도 일어나요. 30배라면 3.3%만 반대로 가도 원금이 사라져요.',
  },
}

export const GUIDE_CARDS: { title: string; body: string }[] = [
  { title: 'FX가 뭐예요?', body: '나라마다 돈의 가치는 매일 바뀌어요. FX(외환) 거래는 두 통화의 교환 비율, 즉 환율이 오를지 내릴지에 거는 거예요. USD/JPY 150은 1달러 = 150엔이라는 뜻이에요.' },
  { title: '매수와 매도', body: GLOSSARY.buySell.body + ' 주식과 달리 내릴 때도 벌 수 있어요.' },
  { title: '핍과 스프레드', body: GLOSSARY.pip.body + ' ' + GLOSSARY.spread.body },
  { title: '레버리지', body: GLOSSARY.leverage.body + ' 환율은 하루에 1%도 잘 안 움직여서, 실제 FX에서는 레버리지를 많이 써요. 그래서 더 위험해요.' },
  { title: '증거금과 강제청산', body: GLOSSARY.margin.body + ' ' + GLOSSARY.stopOut.body },
  { title: '한 판 하는 법', body: '실제 과거 한 달의 환율이 5분 동안 흘러가요. 매수나 매도로 들어가고, 원할 때 청산하세요. 판이 끝나면 그때 실제로 무슨 일이 있었는지 알려드려요. 가이드를 다 읽었으니 10배·30배 레버리지가 열려요.' },
]
