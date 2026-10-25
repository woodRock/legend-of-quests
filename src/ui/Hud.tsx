import { useEffect, useRef, useState } from 'react'
import { walletMax } from '../game/logic'
import type { GameFile } from '../game/types'
import { play } from '../lib/sfx'
import { Hearts } from './Hearts'
import { Rupee } from './Icons'

/** Rupee counter that ticks up toward the real total, like the game's wallet. */
function useCountUp(target: number) {
  const [shown, setShown] = useState(target)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      setShown(target)
      return
    }
    if (shown === target) return
    const t = setTimeout(() => {
      setShown((s) => s + Math.sign(target - s) * Math.max(1, Math.floor(Math.abs(target - s) / 12)))
      if (target > shown) play('cursor')
    }, 45)
    return () => clearTimeout(t)
  }, [shown, target])
  return shown
}

export function Hud({
  file,
  onStart,
  onA,
  onB,
  aLabel,
  bLabel,
  onC,
  cLabel,
}: {
  file: GameFile
  onStart: () => void
  onA: () => void
  onB: () => void
  aLabel: string
  bLabel: string
  /** Shown once a song puts something on a C button. */
  onC?: () => void
  cLabel?: string
}) {
  const rupees = useCountUp(file.rupees)
  const max = walletMax(file)
  const digits = String(max).length
  return (
    <div className="hud">
      <div>
        <Hearts health={file.health} containers={file.containers} />
        <div className={`rupees outline${file.rupees >= max ? ' full' : ''}`}>
          <Rupee size={20} />
          {String(rupees).padStart(digits, '0')}
        </div>
      </div>
      <div className={`buttons${onC ? ' has-c' : ''}`}>
        {onC && (
          <button className="btn-round btn-c" onClick={onC} aria-label={`C: ${cLabel}`}>
            <span><span className="btn-letter">C</span>{cLabel}</span>
          </button>
        )}
        <button className="btn-round btn-start outline" onClick={onStart} aria-label="Pause menu">START</button>
        <button className="btn-round btn-b outline" onClick={onB} aria-label={`B: ${bLabel}`}>
          <span><span className="btn-letter">B</span>{bLabel}</span>
        </button>
        <button className="btn-round btn-a outline" onClick={onA} aria-label={`A: ${aLabel}`}>
          <span><span className="btn-letter">A</span>{aLabel}</span>
        </button>
      </div>
    </div>
  )
}
