export type Tab = 'live' | 'practice' | 'history'

const ICONS: Record<Tab, string> = {
  live: 'M3 17l5-6 4 4 8-9M15 6h5v5',
  practice: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  history: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 2M21 3v5h-5',
}
const LABEL: Record<Tab, string> = { live: '실시간', practice: '연습', history: '기록' }

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" role="tablist">
      {(Object.keys(LABEL) as Tab[]).map(t => (
        <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => onChange(t)}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS[t]} />
          </svg>
          <span>{LABEL[t]}</span>
        </button>
      ))}
    </nav>
  )
}
