import { useState } from 'react'
import { getNickname, setNickname } from '../storage/storage'

export function NicknamePrompt({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState(getNickname() ?? '')
  const valid = name.trim().length >= 1 && [...name.trim()].length <= 12
  const save = () => { if (valid) { setNickname(name); onDone() } }
  return (
    <div className="sheet-backdrop">
      <div className="sheet">
        <div className="sheet-handle" />
        <h2 className="sheet-title">닉네임을 정해주세요</h2>
        <p className="muted small">나중에 친구와 랭킹을 겨룰 때 쓰여요. 1~12자.</p>
        <input
          className="text"
          value={name}
          maxLength={12}
          autoFocus
          placeholder="예: 엔화장인"
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save() }}
        />
        <button className="btn primary wide" disabled={!valid} onClick={save}>시작하기</button>
      </div>
    </div>
  )
}
