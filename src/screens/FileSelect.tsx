import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { STONES } from '../game/logic'
import { backend } from '../lib/backend'
import { play } from '../lib/sfx'
import { useGame } from '../store'
import { Hearts } from '../ui/Hearts'
import { ItemIcon, SkulltulaToken } from '../ui/Icons'

export function FileSelect() {
  const { slots, slotsLoaded, user, startFile, eraseFile, signOut, go } = useGame()
  const [selected, setSelected] = useState<number | null>(null)
  const [erasing, setErasing] = useState(false)
  const [confirmErase, setConfirmErase] = useState<number | null>(null)

  const choose = (slot: number) => {
    const file = slots[slot - 1]
    if (erasing) {
      if (!file) return play('cancel')
      play('cursor')
      return setConfirmErase(slot)
    }
    if (!file) {
      play('select')
      useGame.setState({ nameSlot: slot })
      return go('name')
    }
    play('cursor')
    setSelected(selected === slot ? null : slot)
  }

  return (
    <div className="screen menu-bg">
      <div className="menu-title outline">{erasing ? 'Erase which file?' : 'Please select a file.'}</div>
      <div className="menu-body">
        {[1, 2, 3].map((slot) => {
          const file = slots[slot - 1]
          const isSel = selected === slot || confirmErase === slot
          return (
            <div key={slot}>
              <button className={`panel file-btn${isSel ? ' selected' : ''}`} onClick={() => choose(slot)} disabled={!slotsLoaded}>
                <span className="num">{slot}</span>
                {file ? (
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="name">{file.name}</span>
                    <span className="meta">
                      <Hearts health={file.health} containers={file.containers} size={16} />
                    </span>
                  </span>
                ) : (
                  <span className="empty">{slotsLoaded ? 'Empty' : '…'}</span>
                )}
                {file && (
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ display: 'flex', gap: 2 }}>
                      {STONES.filter((s) => file.items.includes(s)).map((s) => <ItemIcon key={s} item={s} size={18} />)}
                    </span>
                    {file.skulltulas > 0 && (
                      <span className="tokens"><SkulltulaToken size={16} />{file.skulltulas}</span>
                    )}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {selected === slot && file && !erasing && (
                  <motion.div className="panel confirm" style={{ marginBottom: 14 }}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <p>
                      {file.completed} quests complete · {file.quests.filter((q) => !q.doneAt).length} active
                    </p>
                    <div className="menu-row">
                      <button className="pill gold" onClick={() => startFile(slot)}>Yes</button>
                      <button className="pill" onClick={() => { play('cancel'); setSelected(null) }}>Quit</button>
                    </div>
                  </motion.div>
                )}
                {confirmErase === slot && file && (
                  <motion.div className="panel confirm" style={{ marginBottom: 14 }}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <p>Are you sure you want to erase <span className="hl">{file.name}</span>? This cannot be undone.</p>
                    <div className="menu-row">
                      <button className="pill danger" onClick={() => {
                        play('damage'); void eraseFile(slot); setConfirmErase(null); setErasing(false)
                      }}>Yes</button>
                      <button className="pill" onClick={() => { play('cancel'); setConfirmErase(null) }}>Quit</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        <div className="menu-row" style={{ marginTop: 8 }}>
          <button className="pill" onClick={() => { play(erasing ? 'cancel' : 'cursor'); setErasing(!erasing); setConfirmErase(null); setSelected(null) }}>
            {erasing ? 'Cancel' : 'Erase'}
          </button>
          <button className="pill" onClick={() => { play('cancel'); void signOut() }}>Sign Out</button>
        </div>
        <p className="note">
          {user?.email} · {backend.mode === 'cloud' ? 'Synced across your devices' : 'Saved on this device only'}
        </p>
      </div>
    </div>
  )
}
