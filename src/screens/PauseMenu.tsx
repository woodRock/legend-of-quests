import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AREAS } from '../game/areas'
import { STONES, walletMax } from '../game/logic'
import { ITEM_TEXT } from '../game/text'
import type { GameFile, ItemId } from '../game/types'
import { isMuted, play, setMuted } from '../lib/sfx'
import { useGame } from '../store'
import { BossKey, ItemIcon, SkulltulaToken } from '../ui/Icons'

const SCREENS = ['Select Item', 'Map', 'Quest Status', 'Equipment'] as const

function Cell({ item, file, onPick }: { item?: ItemId; file: GameFile; onPick: (text: string) => void }) {
  const have = item && file.items.includes(item)
  return (
    <button className={`slot-cell${have ? '' : ' locked'}`} onClick={() => { play('cursor'); onPick(have ? ITEM_TEXT[item].name : '???') }}>
      {have ? <ItemIcon item={item} size={38} /> : '?'}
    </button>
  )
}

function PieceWheel({ pieces }: { pieces: number }) {
  const quads = ['M42 42V6a36 36 0 0 1 36 36Z', 'M42 42h36a36 36 0 0 1-36 36Z', 'M42 42v36A36 36 0 0 1 6 42Z', 'M42 42H6A36 36 0 0 1 42 6Z']
  return (
    <svg viewBox="0 0 84 84" className="piece-wheel">
      {quads.map((d, i) => (
        <path key={i} d={d} fill={i < pieces ? '#e8303a' : 'rgba(0,0,0,.35)'} stroke="#f7e7c6" strokeWidth="1.5" />
      ))}
    </svg>
  )
}

function Subscreen({ index, file, onPick }: { index: number; file: GameFile; onPick: (t: string) => void }) {
  const { area, travel } = useGame()
  switch (SCREENS[index]) {
    case 'Select Item':
      return (
        <>
          <div className="slot-grid">
            {Array.from({ length: 12 }, (_, i) => <Cell key={i} file={file} onPick={onPick} />)}
          </div>
          <p className="note" style={{ color: '#e9dcb8' }}>Your inventory is empty. Keep questing — items, songs and the shop are found further on.</p>
        </>
      )
    case 'Map':
      return (
        <div className="map-list">
          {AREAS.map((a) => {
            const open = file.areas.includes(a.id)
            const active = file.quests.filter((q) => (a.id === 'field' || q.area === a.id) && !q.doneAt).length
            return (
              <button key={a.id} disabled={!open} className={area === a.id ? 'here' : ''}
                onClick={() => { play('select'); travel(a.id) }}>
                <span>
                  {open ? a.name : '???'}
                  <span className="sub">{open ? a.hint : a.unlock}</span>
                </span>
                {open && <span>{area === a.id ? 'You are here' : `${active} active`}</span>}
              </button>
            )
          })}
        </div>
      )
    case 'Quest Status':
      return (
        <>
          <div className="status-row">
            <div style={{ textAlign: 'center' }}>
              <PieceWheel pieces={file.pieces} />
              <div className="note" style={{ color: '#e9dcb8', marginTop: 4 }}>Pieces of Heart</div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div className="stat"><SkulltulaToken size={26} /> {file.skulltulas}</div>
              <div className="stat"><ItemIcon item="kokiri-sword" size={24} /> {file.completed} <span className="note" style={{ margin: 0, color: '#e9dcb8' }}>quests</span></div>
              <div className="stat"><BossKey size={24} /> {file.dungeonsCleared} <span className="note" style={{ margin: 0, color: '#e9dcb8' }}>dungeons</span></div>
            </div>
          </div>
          <div className="log-section">SPIRITUAL STONES</div>
          <div className="slot-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {STONES.map((s) => <Cell key={s} item={s} file={file} onPick={onPick} />)}
          </div>
          <div className="log-section">SONGS</div>
          <div className="slot-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <button key={i} className="slot-cell locked" onClick={() => onPick('A song not yet learned...')}>♪</button>
            ))}
          </div>
        </>
      )
    case 'Equipment':
      return (
        <>
          <div className="slot-grid">
            <Cell item="kokiri-sword" file={file} onPick={onPick} />
            <Cell file={file} onPick={onPick} />
            <Cell file={file} onPick={onPick} />
            <Cell file={file} onPick={onPick} />
            <Cell item="deku-shield" file={file} onPick={onPick} />
            <Cell file={file} onPick={onPick} />
            <Cell file={file} onPick={onPick} />
            <Cell file={file} onPick={onPick} />
            <Cell item={file.items.includes('giant-wallet') ? 'giant-wallet' : 'adult-wallet'} file={file} onPick={onPick} />
          </div>
          <p className="note" style={{ color: '#e9dcb8' }}>Wallet holds {walletMax(file)} Rupees.</p>
        </>
      )
  }
}

export function PauseMenu() {
  const { file, setPaused, quitToFiles } = useGame()
  const [index, setIndex] = useState(2)
  const [dir, setDir] = useState(1)
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [muted, setMute] = useState(isMuted())
  if (!file) return null

  const turn = (d: number) => {
    play('open')
    setDir(d)
    setCaption('')
    setIndex((i) => (i + d + SCREENS.length) % SCREENS.length)
  }
  const name = (d: number) => SCREENS[(index + d + SCREENS.length) % SCREENS.length]

  const footer: ReactNode = saving ? (
    <div className="panel confirm" style={{ marginTop: 10 }}>
      <p>Your progress is saved automatically. Return to the file select screen?</p>
      <div className="menu-row">
        <button className="pill gold" onClick={() => { play('select'); quitToFiles() }}>Yes</button>
        <button className="pill" onClick={() => { play('cancel'); setSaving(false) }}>No</button>
      </div>
    </div>
  ) : (
    <div className="pause-tabs">
      <button className="tab-btn outline" onClick={() => turn(-1)} aria-label={`Previous: ${name(-1)}`}>◀ Z</button>
      <button className="pill small" onClick={() => { play('cursor'); setSaving(true) }}>Save</button>
      <button className="pill small" onClick={() => { setMuted(!muted); setMute(!muted); play('cursor') }}>{muted ? 'Sound off' : 'Sound on'}</button>
      <button className="pill small gold" onClick={() => { play('close'); setPaused(false) }}>Resume</button>
      <button className="tab-btn outline" onClick={() => turn(1)} aria-label={`Next: ${name(1)}`}>R ▶</button>
    </div>
  )

  return (
    <motion.div className="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pause-stage">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={index}
            className="subscreen"
            custom={dir}
            variants={{
              enter: (d: number) => ({ rotateY: d * -90, x: `${d * 50}%`, opacity: 0.4 }),
              center: { rotateY: 0, x: 0, opacity: 1 },
              exit: (d: number) => ({ rotateY: d * 90, x: `${d * -50}%`, opacity: 0.4 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) turn(1)
              else if (info.offset.x > 60) turn(-1)
            }}
          >
            <h2 className="outline">{SCREENS[index]}</h2>
            <Subscreen index={index} file={file} onPick={setCaption} />
            {caption && <div className="slot-caption">{caption}</div>}
          </motion.div>
        </AnimatePresence>
      </div>
      {footer}
    </motion.div>
  )
}
