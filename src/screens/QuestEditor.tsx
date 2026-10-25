import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { AREAS } from '../game/areas'
import { RUPEE_VALUE, uid } from '../game/logic'
import type { AreaId, Quest, QuestKind, QuestSize } from '../game/types'
import { play } from '../lib/sfx'
import { useGame } from '../store'
import { SheetClose } from '../ui/Sheet'

const KINDS: { id: QuestKind; label: string; sub: string }[] = [
  { id: 'side', label: 'Side Quest', sub: 'A single task' },
  { id: 'dungeon', label: 'Dungeon', sub: 'A project' },
  { id: 'daily', label: 'Skulltula', sub: 'Daily habit' },
]

const SIZES: { id: QuestSize; label: string }[] = [
  { id: 'small', label: 'Quick' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Big' },
]

export type Draft = Omit<Quest, 'id' | 'createdAt'>

export function QuestEditor({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: Quest
  onSave: (q: Draft) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const file = useGame((s) => s.file)!
  const currentArea = useGame((s) => s.area)
  const [kind, setKind] = useState<QuestKind>(initial?.kind ?? 'side')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [area, setArea] = useState<AreaId>(initial?.area ?? currentArea)
  const [size, setSize] = useState<QuestSize>(initial?.size ?? 'medium')
  const [due, setDue] = useState(initial?.due ?? '')
  const [rooms, setRooms] = useState(initial?.rooms ?? [{ id: uid(), title: '', done: false }])
  const [boss, setBoss] = useState(initial?.boss ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const editing = !!initial

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return play('cancel')
    const cleanRooms = rooms.filter((r) => r.title.trim()).map((r) => ({ ...r, title: r.title.trim() }))
    if (kind === 'dungeon' && (cleanRooms.length === 0 || !boss.trim())) return play('cancel')
    play('select')
    onSave({
      kind,
      title: title.trim(),
      area,
      size,
      due: kind === 'daily' ? undefined : due || undefined,
      ...(kind === 'dungeon' ? { rooms: cleanRooms, boss: boss.trim() } : {}),
      ...(initial?.lastDone ? { lastDone: initial.lastDone } : {}),
    })
  }

  return (
    <>
      <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.form className="sheet" onSubmit={submit}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <SheetClose onClose={onClose} />
        <h2 className="outline">{editing ? 'Quest Details' : 'New Quest'}</h2>

        {!editing && (
          <div className="seg">
            {KINDS.map((k) => (
              <button type="button" key={k.id} aria-pressed={kind === k.id} onClick={() => { play('cursor'); setKind(k.id) }}>
                {k.label}<span className="sub">{k.sub}</span>
              </button>
            ))}
          </div>
        )}

        <label className="field-label" htmlFor="q-title">{kind === 'dungeon' ? 'Dungeon name' : 'Quest'}</label>
        <input id="q-title" className="text-input" autoFocus={!editing} value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === 'dungeon' ? 'e.g. Launch the website' : kind === 'daily' ? 'e.g. Stretch for 10 minutes' : 'e.g. Return library books'} />

        {kind === 'dungeon' && (
          <>
            <label className="field-label">Rooms (steps)</label>
            {rooms.map((r, i) => (
              <div className="room-row" key={r.id}>
                <input className="text-input" value={r.title} disabled={r.done} placeholder={`Room ${i + 1}`}
                  onChange={(e) => setRooms(rooms.map((x) => (x.id === r.id ? { ...x, title: e.target.value } : x)))} />
                {!r.done && rooms.length > 1 && (
                  <button type="button" className="icon-btn" aria-label="Remove room"
                    onClick={() => setRooms(rooms.filter((x) => x.id !== r.id))}>×</button>
                )}
              </div>
            ))}
            <button type="button" className="pill small" style={{ width: '100%', marginBottom: 14 }}
              onClick={() => { play('cursor'); setRooms([...rooms, { id: uid(), title: '', done: false }]) }}>
              + Add room
            </button>
            <label className="field-label" htmlFor="q-boss">Boss (the final step)</label>
            <input id="q-boss" className="text-input" value={boss} onChange={(e) => setBoss(e.target.value)} placeholder="e.g. Press publish" />
          </>
        )}

        {kind === 'side' && (
          <>
            <label className="field-label">Size</label>
            <div className="seg">
              {SIZES.map((s) => (
                <button type="button" key={s.id} aria-pressed={size === s.id} onClick={() => { play('cursor'); setSize(s.id) }}>
                  {s.label}<span className="sub">{RUPEE_VALUE[s.id]} rupee{RUPEE_VALUE[s.id] > 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <label className="field-label">Area</label>
        <div className="area-grid">
          {AREAS.map((a) => {
            const open = file.areas.includes(a.id)
            return (
              <button type="button" key={a.id} disabled={!open} aria-pressed={area === a.id} onClick={() => { play('cursor'); setArea(a.id) }}>
                {open ? a.name : '???'}<span className="sub">{open ? a.hint : a.unlock}</span>
              </button>
            )
          })}
        </div>

        {kind !== 'daily' && (
          <>
            <label className="field-label" htmlFor="q-due">Due date (optional)</label>
            <input id="q-due" className="text-input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </>
        )}

        <div className="menu-row">
          <button type="button" className="pill" onClick={() => { play('cancel'); onClose() }}>Cancel</button>
          <button className="pill gold">{editing ? 'Save' : 'Accept Quest'}</button>
        </div>
        {onDelete && (
          <div style={{ marginTop: 12 }}>
            {confirmDelete ? (
              <div className="menu-row">
                <button type="button" className="pill danger small" onClick={() => { play('damage'); onDelete() }}>Abandon it</button>
                <button type="button" className="pill small" onClick={() => setConfirmDelete(false)}>Keep it</button>
              </div>
            ) : (
              <button type="button" className="pill danger small" style={{ width: '100%' }} onClick={() => { play('cursor'); setConfirmDelete(true) }}>
                Abandon quest
              </button>
            )}
          </div>
        )}
      </motion.form>
    </>
  )
}
