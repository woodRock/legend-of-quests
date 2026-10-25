import { useEffect, useState } from 'react'
import { play } from '../lib/sfx'
import { useGame } from '../store'

const MAX = 8
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('')
// 26 letters + 10 digits fill four rows of nine exactly.
const DIGITS = '0123456789'.split('')

export function NameEntry() {
  const { nameSlot, createFile, go } = useGame()
  const [name, setName] = useState('')
  const [lower, setLower] = useState(false)

  const type = (ch: string) => {
    if (name.length >= MAX) return play('cancel')
    play('cursor')
    setName((n) => (n + ch).slice(0, MAX))
  }
  const back = () => {
    play('cancel')
    setName((n) => n.slice(0, -1))
  }
  const end = () => {
    const clean = name.trim()
    if (!clean || !nameSlot) return play('cancel')
    play('select')
    createFile(nameSlot, clean)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') end()
      else if (e.key === 'Backspace') back()
      else if (e.key === 'Escape') go('files')
      else if (/^[a-zA-Z0-9 ]$/.test(e.key)) type(e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const keys = [...(lower ? LOWER : UPPER), ...DIGITS]

  return (
    <div className="screen menu-bg">
      <div className="menu-title outline">What is your name?</div>
      <div className="menu-body">
        <div className="panel name-display">
          {Array.from({ length: MAX }, (_, i) => (
            <span key={i} className={`slot${i === name.length ? ' cursor' : ''}`}>{name[i] ?? ''}</span>
          ))}
        </div>
        <div className="panel keys">
          {keys.map((k) => (
            <button key={k} className="key" onClick={() => type(k)}>{k}</button>
          ))}
          <button className="key" style={{ gridColumn: 'span 2', aspectRatio: 'auto' }} onClick={() => type(' ')}>Space</button>
          <button className="key" style={{ gridColumn: 'span 2', aspectRatio: 'auto' }} onClick={() => { play('cursor'); setLower(!lower) }}>
            {lower ? 'ABC' : 'abc'}
          </button>
          <button className="key" style={{ gridColumn: 'span 2', aspectRatio: 'auto' }} onClick={back}>←</button>
          <button className="key hl" style={{ gridColumn: 'span 3', aspectRatio: 'auto' }} onClick={end}>END</button>
        </div>
        <div className="menu-row" style={{ marginTop: 14 }}>
          <button className="pill" onClick={() => { play('cancel'); go('files') }}>Back</button>
        </div>
      </div>
    </div>
  )
}
