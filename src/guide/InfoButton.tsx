import { useState } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY, type Term } from './glossary'

export function InfoButton({ term }: { term: Term }) {
  const [open, setOpen] = useState(false)
  const g = GLOSSARY[term]
  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className="info"
        aria-label={`${g.title} 설명`}
        onClick={e => { e.stopPropagation(); setOpen(true) }}
        onKeyDown={e => { if (e.key === 'Enter') setOpen(true) }}
      >
        ⓘ
      </span>
      {open && createPortal(
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">{g.title}</h2>
            <p className="sheet-body">{g.body}</p>
            <button className="btn wide" onClick={() => setOpen(false)}>알겠어요</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
