import { useState } from 'react'
import { Home } from './screens/Home'
import { TradeScreen } from './screens/Trade'
import { Result } from './screens/Result'
import { GuideCards } from './guide/GuideCards'
import { NicknamePrompt } from './components/NicknamePrompt'
import { addRecord, getNickname } from './storage/storage'
import type { Route } from './screens/types'

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [guide, setGuide] = useState(false)
  const [askName, setAskName] = useState(() => getNickname() === null)
  // 같은 시나리오를 다시 할 때 거래 화면을 새로 만들기 위한 키
  const [round, setRound] = useState(0)

  const start = (scenario: Route & { name: 'trade' }) => { setRound(r => r + 1); setRoute(scenario) }

  return (
    <>
      {route.name === 'home' && (
        <Home
          onStart={(scenario, leverage) => start({ name: 'trade', scenario, leverage })}
          onOpenGuide={() => setGuide(true)}
          onEditNickname={() => setAskName(true)}
        />
      )}
      {route.name === 'trade' && (
        <TradeScreen
          key={round}
          scenario={route.scenario}
          leverage={route.leverage}
          onQuit={() => setRoute({ name: 'home' })}
          onFinish={result => { addRecord(result.record); setRoute({ name: 'result', result }) }}
        />
      )}
      {route.name === 'result' && (
        <Result
          result={route.result}
          onHome={() => setRoute({ name: 'home' })}
          onRetry={leverage => start({ name: 'trade', scenario: route.result.scenario, leverage })}
        />
      )}
      {guide && <GuideCards onClose={() => setGuide(false)} />}
      {askName && <NicknamePrompt onDone={() => setAskName(false)} />}
    </>
  )
}
