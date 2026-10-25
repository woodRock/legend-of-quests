import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { play } from '../lib/sfx'
import { useGame } from '../store'

export function Emblem() {
  return (
    <svg viewBox="0 0 64 56" className="emblem">
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3b8" />
          <stop offset=".5" stopColor="#f2c94c" />
          <stop offset="1" stopColor="#a87b12" />
        </linearGradient>
      </defs>
      <g fill="url(#gold)" stroke="#5a3e05" strokeWidth="1" strokeLinejoin="round">
        <path d="M32 2 46 27H18Z" />
        <path d="M18 27 32 52H4Z" />
        <path d="M46 27 60 52H32Z" />
      </g>
    </svg>
  )
}

function Rider() {
  return (
    <svg viewBox="0 0 64 44" className="rider" aria-hidden="true">
      <path
        fill="#030712"
        d="M50 12c3-1 6 0 8 3l-2 2-3-1-2 6c-1 3-3 5-6 6l2 12h-3l-3-10-14 1-4 9h-3l2-10c-3-1-5-3-6-6-3 2-6 6-8 9l-2-1c2-5 5-9 9-12 2-2 6-3 10-3h14l3-4c1-1 2-1 3-2Zm-17-2c0-3 2-5 4-5s4 2 4 4l-1 4-3 2-4-1Z"
      />
    </svg>
  )
}

export function Title() {
  const { user, go, transitionTo } = useGame()
  const [ready, setReady] = useState(false)
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 60,
        r: Math.random() * 1.1 + 0.3,
        d: 2 + Math.random() * 4,
      })),
    [],
  )

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1800)
    return () => clearTimeout(t)
  }, [])

  const start = () => {
    if (!ready || user === undefined) return
    play('start')
    void transitionTo('white', () => go(user ? 'files' : 'login'))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && start()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="screen title-screen" onClick={start}>
      <svg className="stars" viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r / 6} fill="#fff">
            <animate attributeName="opacity" values="1;.2;1" dur={`${s.d}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
      <div className="moon" />
      <svg className="hills" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 90C60 50 120 70 180 60s140-40 220 10V200H0Z" fill="#101c3a" />
        <path d="M0 130c70-30 130-20 200-30s140 10 200 0V200H0Z" fill="#0a1328" />
        <path d="M0 160c80-20 160-10 240-15s120 5 160 0V200H0Z" fill="#050a18" />
      </svg>
      <Rider />
      <div className="fog" />
      <div className="fog two" />

      <motion.div
        className="logo"
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut', delay: 0.3 }}
      >
        <Emblem />
        <div className="the">THE LEGEND OF</div>
        <h1>QUESTS</h1>
        <div className="subtitle">OCARINA OF TASKS</div>
      </motion.div>

      {ready && <div className="press-start outline">{user === undefined ? 'LOADING…' : 'PRESS START'}</div>}
      <div className="copyright">A fan-made quest log. Not affiliated with Nintendo.</div>
    </div>
  )
}
