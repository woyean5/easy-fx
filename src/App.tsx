import { useState } from 'react'
import { Home } from './screens/Home'
import { TradeScreen } from './screens/Trade'
import { Result } from './screens/Result'
import { LiveHome } from './screens/LiveHome'
import { LiveDetail } from './screens/LiveDetail'
import { History } from './screens/History'
import { GuideCards } from './guide/GuideCards'
import { NicknamePrompt } from './components/NicknamePrompt'
import { TabBar, type Tab } from './components/TabBar'
import { LiveStopOutNotice } from './components/LiveStopOutNotice'
import { addRecord, getNickname, isOnboarded } from './storage/storage'
import { Onboarding } from './guide/Onboarding'
import { useLive } from './live/useLive'
import type { LivePair } from './live/quotes'
import type { Route } from './screens/types'

export default function App() {
  const [tab, setTab] = useState<Tab>('live')
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [detail, setDetail] = useState<LivePair | null>(null)
  const [guide, setGuide] = useState(false)
  const [askName, setAskName] = useState(() => getNickname() === null)
  const [onboard, setOnboard] = useState(() => !isOnboarded())
  const [round, setRound] = useState(0)
  const live = useLive()

  const start = (r: Route & { name: 'trade' }) => { setRound(n => n + 1); setRoute(r) }

  // 연습 판 진행/결과 화면은 탭 바 없이 전체 화면
  if (route.name === 'trade') {
    return (
      <TradeScreen
        key={round}
        scenario={route.scenario}
        leverage={route.leverage}
        onQuit={() => setRoute({ name: 'home' })}
        onFinish={result => { addRecord(result.record); setRoute({ name: 'result', result }) }}
      />
    )
  }
  if (route.name === 'result') {
    return (
      <Result
        result={route.result}
        onHome={() => setRoute({ name: 'home' })}
        onRetry={leverage => start({ name: 'trade', scenario: route.result.scenario, leverage })}
      />
    )
  }

  return (
    <>
      {tab === 'live' && <LiveHome live={live} onOpen={setDetail} onOpenGuide={() => setGuide(true)} />}
      {tab === 'practice' && (
        <Home
          onStart={(scenario, leverage) => start({ name: 'trade', scenario, leverage })}
          onOpenGuide={() => setGuide(true)}
          onEditNickname={() => setAskName(true)}
        />
      )}
      {tab === 'history' && <History live={live} />}
      <TabBar tab={tab} onChange={setTab} />

      {detail && <LiveDetail pair={detail} live={live} onClose={() => setDetail(null)} onOpenGuide={() => setGuide(true)} />}
      {live.notice && <LiveStopOutNotice notice={live.notice} onClose={live.dismissNotice} />}
      {/* 순서: 소개 → 닉네임 → (골랐다면) 입문 가이드 */}
      {onboard && <Onboarding onDone={c => { setOnboard(false); if (c === 'guide') setGuide(true) }} />}
      {!onboard && askName && <NicknamePrompt onDone={() => setAskName(false)} />}
      {!onboard && !askName && guide && <GuideCards onClose={() => setGuide(false)} />}
    </>
  )
}
