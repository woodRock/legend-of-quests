import { useState } from 'react'
import { motion } from 'framer-motion'
import { areaById } from '../game/areas'
import { bossDoorOpen, clearRoom, defeatBoss } from '../game/logic'
import type { Quest } from '../game/types'
import { play } from '../lib/sfx'
import { useGame } from '../store'
import { BossKey, Compass, DungeonMap } from '../ui/Icons'
import { SheetClose } from '../ui/Sheet'

export function DungeonView({ quest, onEdit, onClose }: { quest: Quest; onEdit: () => void; onClose: () => void }) {
  const { file, commit } = useGame()
  const [facing, setFacing] = useState(false)
  const rooms = quest.rooms ?? []
  const cleared = rooms.filter((r) => r.done).length
  const open = bossDoorOpen(quest)

  const clear = (roomId: string) => {
    if (!file) return
    const res = clearRoom(file, quest.id, roomId)
    if (res.file === file) return
    play(res.events.some((e) => e.type === 'bossKey') ? 'discover' : 'select')
    commit(res.file, res.events)
  }

  const fight = () => {
    if (!file) return
    const res = defeatBoss(file, quest.id)
    commit(res.file, res.events)
    onClose()
  }

  return (
    <>
      <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <SheetClose onClose={onClose} />
        <div className="dungeon-head">
          <h2 className="outline" style={{ marginBottom: 2 }}>{quest.title}</h2>
          <div className="note" style={{ margin: 0 }}>{areaById(quest.area).name} · {cleared}/{rooms.length} rooms cleared</div>
        </div>
        <div className="dungeon-items">
          <div className={cleared >= 1 ? 'have' : ''} title="Dungeon Map"><DungeonMap size={36} /></div>
          <div className={cleared >= Math.ceil(rooms.length / 2) && rooms.length > 1 ? 'have' : ''} title="Compass"><Compass size={36} /></div>
          <div className={open ? 'have' : ''} title="Boss Key"><BossKey size={36} /></div>
        </div>

        {rooms.map((r, i) => (
          <button key={r.id} className={`room${r.done ? ' done' : ''}`} onClick={() => clear(r.id)} disabled={r.done || !!quest.doneAt}>
            <span className="door" />
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>ROOM {i + 1}</span>
              {r.title}
            </span>
            {!r.done && <span className="note" style={{ margin: 0 }}>Clear</span>}
          </button>
        ))}

        {!quest.doneAt && (
          facing ? (
            <div className="panel confirm" style={{ marginTop: 6 }}>
              <p>Boss battle: <span className="hl">{quest.boss}</span>. Have you defeated it?</p>
              <div className="menu-row">
                <button className="pill gold" onClick={fight}>Defeated!</button>
                <button className="pill" onClick={() => { play('cancel'); setFacing(false) }}>Not yet</button>
              </div>
            </div>
          ) : (
            <button className={`boss-door${open ? ' open' : ''}`} disabled={!open}
              onClick={() => { play('open'); setFacing(true) }}>
              {open ? 'Enter the Boss Room' : 'Boss Door'}
              <span className="chains">{open ? quest.boss : `Locked. Clear every room to find the Boss Key.`}</span>
            </button>
          )
        )}

        <div className="menu-row" style={{ marginTop: 14 }}>
          <button className="pill" onClick={() => { play('cancel'); onClose() }}>Leave</button>
          {!quest.doneAt && <button className="pill" onClick={() => { play('cursor'); onEdit() }}>Edit</button>}
        </div>
      </motion.div>
    </>
  )
}
