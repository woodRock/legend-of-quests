import { useEffect, useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { areaById } from '../game/areas'
import {
  addQuest, hasSong, isOverdue, nextQuest, playStorms, postpone, stormsReadyOn, today, toggleFocus,
  tomorrowOf, undoCompletion, undoable,
} from '../game/logic'
import { NOTE_FREQ, SONGS, type Song } from '../game/songs'
import type { Quest } from '../game/types'
import { play, playMelody } from '../lib/sfx'
import { useGame, type Menu } from '../store'
import { MusicNote, NoteButton } from '../ui/Icons'
import { Sheet } from '../ui/Sheet'
import { TextBox } from '../ui/TextBox'

const NOTE_MS = 380

/** Shows a song's notes appearing on a staff while its melody plays, then calls onDone. */
function Performance({ song, onDone }: { song: Song; onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    playMelody(song.notes.map((n) => NOTE_FREQ[n]), NOTE_MS)
    const tick = setInterval(() => setShown((s) => s + 1), NOTE_MS)
    const end = setTimeout(() => done.current(), NOTE_MS * song.notes.length + 700)
    return () => {
      clearInterval(tick)
      clearTimeout(end)
    }
  }, [song])
  return (
    <motion.div className="performance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="staff">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="staff-line" />)}
        <div className="staff-notes">
          {song.notes.map((n, i) => (
            <motion.div key={i} className={`staff-note n-${n}`} initial={{ opacity: 0, scale: 0.4 }}
              animate={i < shown + 1 ? { opacity: 1, scale: 1 } : {}}>
              <NoteButton note={n} size={30} />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="perf-title outline" style={{ color: song.color }}>{song.name}</div>
    </motion.div>
  )
}

const TARGET: Record<Song['id'], Menu | null> = {
  zelda: null, epona: 'quickadd', time: 'time', saria: 'saria', sun: 'sun', storms: 'storms',
}

export function OcarinaMenu() {
  const { file, commit, setMenu } = useGame()
  const [playing, setPlaying] = useState<Song | null>(null)
  if (!file) return null

  const finish = () => {
    if (!playing) return
    // Read the save as it is now, not as it was when the ocarina opened.
    const current = useGame.getState().file
    if (playing.id === 'zelda' && current) {
      commit(toggleFocus(current))
      play(current.focus ? 'close' : 'discover')
    }
    setPlaying(null)
    setMenu(TARGET[playing.id])
  }

  if (playing) return <Performance song={playing} onDone={finish} />

  return (
    <Sheet onClose={() => { play('cancel'); setMenu(null) }}>
      <h2 className="outline">Fairy Ocarina</h2>
      {SONGS.map((song) => {
        const known = hasSong(file, song.id)
        return (
          <button key={song.id} className={`song-row${known ? '' : ' locked'}`} disabled={!known}
            onClick={() => { play('select'); setPlaying(song) }}>
            <MusicNote color={known ? song.color : 'rgba(255,255,255,.25)'} />
            <span className="song-main">
              <span className="song-name">
                {known ? song.name : '???'}
                {known && song.id === 'zelda' && file.focus && <span className="focus-tag" style={{ marginLeft: 8 }}>END FOCUS</span>}
              </span>
              <span className="song-notes">
                {known ? song.notes.map((n, i) => <NoteButton key={i} note={n} size={18} />) : null}
              </span>
              <span className="shelf-sub">
                {known ? (song.id === 'zelda' && file.focus ? 'Focus is on. Play it to end focus.' : song.effect) : song.unlock}
              </span>
            </span>
          </button>
        )
      })}
      <button className="pill" style={{ width: '100%', marginTop: 10 }} onClick={() => { play('cancel'); setMenu(null) }}>Put it away</button>
    </Sheet>
  )
}

export function QuickAdd() {
  const { file, area, commit, setMenu } = useGame()
  const [title, setTitle] = useState('')
  const [added, setAdded] = useState<string[]>([])
  if (!file) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return play('cancel')
    play('select')
    commit(addQuest(file, { kind: 'side', title: title.trim(), area, size: 'medium' }))
    setAdded([title.trim(), ...added])
    setTitle('')
  }

  return (
    <Sheet onClose={() => setMenu(null)}>
      <h2 className="outline">Epona's Gallop</h2>
      <p className="note" style={{ marginTop: -6 }}>Type a quest and press enter. Each becomes a medium side quest in {areaById(area).name}.</p>
      <form onSubmit={submit} className="room-row">
        <input className="text-input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Next quest…" />
        <button className="icon-btn" aria-label="Add quest">+</button>
      </form>
      {added.map((t, i) => <div key={i} className="shelf-sub" style={{ padding: '4px 6px' }}>✓ {t}</div>)}
      <button className="pill gold" style={{ width: '100%', marginTop: 12 }} onClick={() => { play('close'); setMenu(null) }}>Done</button>
    </Sheet>
  )
}

export function SongOfTime() {
  const { file, commit, setMenu } = useGame()
  if (!file) return null
  const recent = undoable(file)
  const overdue = file.quests.filter((q) => isOverdue(q))

  return (
    <Sheet onClose={() => setMenu(null)}>
      <h2 className="outline">Song of Time</h2>
      <div className="log-section">TURN BACK TIME</div>
      {recent.length === 0 && <p className="note" style={{ marginTop: 0 }}>Nothing to undo.</p>}
      {recent.map((q) => (
        <div key={q.id} className="shelf-item">
          <div className="shelf-main">
            <div>{q.title}</div>
            <div className="shelf-sub">{q.kind === 'daily' ? 'Defeated today' : 'Completed'}</div>
          </div>
          <button className="pill small" onClick={() => { play('cancel'); commit(undoCompletion(file, q.id)) }}>Undo</button>
        </div>
      ))}
      <p className="note">Undoing takes back the quest's rupees. Hearts and items you received stay.</p>

      <div className="log-section">MOVE OVERDUE TO TOMORROW</div>
      {overdue.length === 0 && <p className="note" style={{ marginTop: 0 }}>Nothing is overdue.</p>}
      {overdue.map((q) => (
        <div key={q.id} className="shelf-item">
          <div className="shelf-main">
            <div>{q.title}</div>
            <div className="shelf-sub late">Was due {q.due}</div>
          </div>
          <button className="pill small" onClick={() => { play('select'); commit(postpone(file, [q.id])) }}>Tomorrow</button>
        </div>
      ))}
      {overdue.length > 1 && (
        <button className="pill small" style={{ width: '100%' }} onClick={() => { play('select'); commit(postpone(file, overdue.map((q) => q.id))) }}>
          Move all {overdue.length} to tomorrow
        </button>
      )}
      <button className="pill" style={{ width: '100%', marginTop: 14 }} onClick={() => { play('close'); setMenu(null) }}>Done</button>
    </Sheet>
  )
}

function ReviewList({ title, quests, empty }: { title: string; quests: Quest[]; empty: string }) {
  return (
    <>
      <div className="log-section">{title}</div>
      {quests.length === 0 ? <p className="note" style={{ marginTop: 0 }}>{empty}</p> : quests.map((q) => (
        <div key={q.id} className="shelf-sub" style={{ padding: '5px 6px', fontSize: 15, color: 'var(--text)' }}>
          • {q.title} <span style={{ color: 'var(--muted)', fontSize: 12 }}>{areaById(q.area).name}</span>
        </div>
      ))}
    </>
  )
}

export function SunReview() {
  const { file, setMenu } = useGame()
  if (!file) return null
  const day = today()
  const open = file.quests.filter((q) => !q.doneAt && q.kind !== 'daily')
  return (
    <Sheet onClose={() => setMenu(null)} className="sun">
      <h2 className="outline">A New Day</h2>
      <p className="note" style={{ marginTop: -6 }}>
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <ReviewList title="OVERDUE" quests={open.filter((q) => isOverdue(q, day))} empty="Nothing overdue. Well done!" />
      <ReviewList title="DUE TODAY" quests={open.filter((q) => q.due === day)} empty="Nothing due today." />
      <ReviewList title="SKULLTULAS LEFT" quests={file.quests.filter((q) => q.kind === 'daily' && q.lastDone !== day)} empty="All dailies done." />
      <ReviewList title="TOMORROW" quests={open.filter((q) => q.due === tomorrowOf(day))} empty="Nothing due tomorrow." />
      <button className="pill gold" style={{ width: '100%', marginTop: 14 }} onClick={() => { play('close'); setMenu(null) }}>Begin the day</button>
    </Sheet>
  )
}

export function SongOfStorms() {
  const { file, commit, setMenu } = useGame()
  if (!file) return null
  const day = today()
  const readyOn = stormsReadyOn(file)
  const ready = readyOn <= day
  const overdue = file.quests.filter((q) => isOverdue(q, day)).length

  return (
    <Sheet onClose={() => setMenu(null)} className="storm">
      <h2 className="outline">Song of Storms</h2>
      {ready ? (
        <>
          <p style={{ textAlign: 'center', lineHeight: 1.5 }}>
            Dark clouds gather... The rain will wash {overdue === 0 ? 'nothing away, but still' : <><span className="hl">{overdue}</span> overdue {overdue === 1 ? 'quest' : 'quests'} to today and</>} restore all your hearts.
            <br />It can only be called once a week.
          </p>
          <div className="menu-row">
            <button className="pill" onClick={() => { play('cancel'); setMenu(null) }}>Not now</button>
            <button className="pill gold" onClick={() => {
              const res = playStorms(file)
              play('discover')
              commit(res.file, res.events)
              setMenu(null)
            }}>Call the storm</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ textAlign: 'center', lineHeight: 1.5 }}>
            The skies are calm. The storm will gather again on{' '}
            <span className="hl">{new Date(readyOn + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>.
          </p>
          <button className="pill" style={{ width: '100%' }} onClick={() => { play('cancel'); setMenu(null) }}>OK</button>
        </>
      )}
    </Sheet>
  )
}

export function SariaAdvice() {
  const { file, setMenu } = useGame()
  if (!file) return null
  const q = nextQuest(file)
  const pages = !q
    ? ["Hi, it's Saria! You've done everything on your list. Take a rest. You've earned it!"]
    : [
        "Hi, it's Saria! I've been thinking about your adventure...",
        isOverdue(q)
          ? `|${q.title}| is overdue. Taking care of it first will stop it wearing down your hearts.`
          : q.due === today()
            ? `|${q.title}| is due today. How about starting there?`
            : q.kind === 'daily'
              ? `There's a Gold Skulltula lurking: |${q.title}|. It only takes one a day!`
              : q.kind === 'dungeon'
                ? `How about clearing another room of |${q.title}|? ${(q.rooms ?? []).filter((r) => !r.done).length} rooms to go.`
                : `How about |${q.title}|? It's been waiting the longest.`,
        "Play my song any time you're not sure what to do next. Good luck!",
      ]
  return <TextBox speaker="Saria" pages={pages} onDone={() => { play('close'); setMenu(null) }} />
}
