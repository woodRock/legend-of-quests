import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { areaById } from '../game/areas'
import { eventText, isBigEvent } from '../game/text'
import type { GameEvent } from '../game/types'
import { play, playMelody } from '../lib/sfx'
import { useGame } from '../store'
import { NOTE_FREQ, songById } from '../game/songs'
import {
  Bottle, BossKey, Compass, DungeonMap, Fairy, HeartContainer, ItemIcon, MusicNote, PieceOfHeart, Rupee, SkulltulaToken,
  SmallKey,
} from './Icons'
import { TextBox } from './TextBox'

/** Fade to black/white between screens, with the area's name card when entering one. */
export function TransitionCover() {
  const t = useGame((s) => s.transition)
  return (
    <AnimatePresence>
      {t && (
        <motion.div
          key="cover"
          className={`cover ${t.color}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: t.phase === 'out' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={t.area ? { background: '#000' } : undefined}
        >
          <AnimatePresence>
            {t.area && t.phase === 'card' && (
              <motion.div className="area-card" key="card"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                <div className="rule" />
                <div className="name">{areaById(t.area).name}</div>
                <div className="rule" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function EventIcon({ e }: { e: GameEvent }) {
  switch (e.type) {
    case 'item': return <ItemIcon item={e.item} size={96} />
    case 'piece': return <PieceOfHeart size={96} />
    case 'container': return <HeartContainer size={96} />
    case 'key': return <SmallKey size={96} />
    case 'map': return <DungeonMap size={96} />
    case 'compass': return <Compass size={96} />
    case 'bossKey': return <BossKey size={96} />
    case 'token': return <SkulltulaToken size={96} />
    case 'song': return <MusicNote size={96} color={songById(e.song).color} />
    case 'bottle': return <Bottle size={96} content={e.content} />
    case 'reward': return <Rupee size={96} color="gold" />
    case 'fairy': return <Fairy size={96} />
    default: return null
  }
}

/** Plays queued rewards one at a time: small ones as sounds, big ones as an item-get scene. */
export function EventPlayer() {
  const { events, shiftEvent, transition } = useGame()
  const e = events[0]
  const big = e && isBigEvent(e)

  useEffect(() => {
    if (!e || transition) return
    if (!big) {
      if (e.type === 'heal') play('heal')
      shiftEvent()
      return
    }
    if (e.type === 'area') play('discover')
    else if (e.type === 'damage') play('damage')
    else if (e.type === 'song') playMelody(songById(e.song).notes.map((n) => NOTE_FREQ[n]))
    else if (e.type === 'fairy') play('heal')
    else play('item')
  }, [e, big, shiftEvent, transition])

  if (!e || !big || transition) return null
  const hasIcon = !['area', 'damage'].includes(e.type)
  return (
    <motion.div className="item-get" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {hasIcon && (
        <>
          <div className="rays" />
          <motion.div className="item" initial={{ y: 60, scale: 0.3, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 120 }}>
            <EventIcon e={e} />
          </motion.div>
        </>
      )}
      <TextBox key={events.length + e.type} pages={[eventText(e)]} onDone={shiftEvent}
        speaker={e.type === 'damage' ? 'Navi' : undefined} />
    </motion.div>
  )
}

export function GameOver() {
  const { gameOver, events, continueAfterGameOver, quitToFiles } = useGame()
  // Let pending messages (like the damage report) play first.
  const show = gameOver && events.length === 0
  useEffect(() => {
    if (show) play('gameOver')
  }, [show])
  if (!show) return null
  return (
    <motion.div className="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
      <h1>GAME OVER</h1>
      <p className="note" style={{ maxWidth: 320 }}>Overdue quests took the last of your hearts. Nothing is lost: take a breath, then pick up where you left off.</p>
      <div style={{ display: 'grid', gap: 10, width: 220 }}>
        <button className="pill gold" onClick={() => { play('select'); continueAfterGameOver() }}>Continue</button>
        <button className="pill" onClick={() => { play('cancel'); continueAfterGameOver(); quitToFiles() }}>Save &amp; Quit</button>
      </div>
    </motion.div>
  )
}
