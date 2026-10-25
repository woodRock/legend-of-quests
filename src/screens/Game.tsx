import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { areaById } from '../game/areas'
import {
  addQuest, collectDaily, completeSideQuest, dailyDoneToday, isOverdue, markTip, removeQuest, today, updateQuest,
} from '../game/logic'
import { NAVI_TIPS } from '../game/text'
import type { Quest } from '../game/types'
import { play } from '../lib/sfx'
import { useGame } from '../store'
import { Hud } from '../ui/Hud'
import { BossKey, Fairy, Rupee, SkulltulaToken, SmallKey } from '../ui/Icons'
import { TextBox } from '../ui/TextBox'
import { DungeonView } from './DungeonView'
import { PauseMenu } from './PauseMenu'
import { QuestEditor, type Draft } from './QuestEditor'

type Sheet = { type: 'new' } | { type: 'edit'; id: string } | { type: 'dungeon'; id: string } | null
type Tip = keyof typeof NAVI_TIPS

const SIZE_RUPEE = { small: 'green', medium: 'blue', large: 'red' } as const

const fmtDue = (due: string) => {
  const d = new Date(due + 'T00:00:00')
  const diff = Math.round((d.getTime() - new Date(today() + 'T00:00:00').getTime()) / 86_400_000)
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff < 0) return `${-diff} day${diff === -1 ? '' : 's'} overdue`
  return `Due ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

function QuestRow({ quest, onOpen, onAct }: { quest: Quest; onOpen: () => void; onAct: () => void }) {
  const overdue = isOverdue(quest)
  const doneToday = dailyDoneToday(quest)
  const done = !!quest.doneAt || doneToday
  const rooms = quest.rooms ?? []
  const cleared = rooms.filter((r) => r.done).length

  const icon =
    quest.kind === 'dungeon' ? (cleared === rooms.length && rooms.length ? <BossKey size={30} /> : <SmallKey size={30} />)
    : quest.kind === 'daily' ? <SkulltulaToken size={30} />
    : <Rupee size={28} color={SIZE_RUPEE[quest.size]} />

  return (
    <div className={`quest${overdue ? ' overdue' : ''}${done ? ' done' : ''}`}>
      <button className="q-icon" onClick={onAct} disabled={done}
        aria-label={quest.kind === 'dungeon' ? 'Enter dungeon' : quest.kind === 'daily' ? 'Defeat Skulltula' : 'Complete quest'}>
        {icon}
      </button>
      <button className="q-main" style={{ textAlign: 'left' }} onClick={onOpen}>
        <div className="q-title">{quest.title}</div>
        <div className="q-meta">
          {quest.kind === 'dungeon' && <span>{cleared}/{rooms.length} rooms</span>}
          {quest.kind === 'daily' && <span>{doneToday ? 'Defeated today' : 'Lurking today'}</span>}
          {quest.due && !quest.doneAt && <span className={overdue ? 'late' : ''}>{fmtDue(quest.due)}</span>}
        </div>
        {quest.kind === 'dungeon' && rooms.length > 0 && (
          <div className="progress"><div style={{ width: `${(cleared / rooms.length) * 100}%` }} /></div>
        )}
      </button>
    </div>
  )
}

export function Game() {
  const { file, area, commit, events, paused, setPaused, transition } = useGame()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const [showDone, setShowDone] = useState(false)

  const info = areaById(area)
  const quests = useMemo(
    () => (file?.quests ?? []).filter((q) => area === 'field' || q.area === area),
    [file?.quests, area],
  )

  // Navi speaks up once per tip, when nothing else is on screen.
  const busy = !!transition || events.length > 0 || paused || !!sheet || !!tip
  useEffect(() => {
    if (!file || busy) return
    const want: Tip | null = !file.tips.includes('welcome') ? 'welcome'
      : !file.tips.includes('overdue') && file.quests.some((q) => isOverdue(q)) ? 'overdue'
      : !file.tips.includes('daily') && file.quests.some((q) => q.kind === 'daily') ? 'daily'
      : null
    if (want) {
      const t = setTimeout(() => setTip(want), 500)
      return () => clearTimeout(t)
    }
  }, [file, busy])

  if (!file) return null

  const dungeons = quests.filter((q) => q.kind === 'dungeon' && !q.doneAt)
  const sides = quests.filter((q) => q.kind === 'side' && !q.doneAt)
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
  const dailies = quests.filter((q) => q.kind === 'daily')
  const done = quests.filter((q) => q.doneAt).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).slice(0, 20)
  const editing = sheet?.type === 'edit' ? file.quests.find((q) => q.id === sheet.id) : undefined
  const dungeon = sheet?.type === 'dungeon' ? file.quests.find((q) => q.id === sheet.id) : undefined

  const act = (q: Quest) => {
    if (q.kind === 'dungeon') {
      play('open')
      return setSheet({ type: 'dungeon', id: q.id })
    }
    const res = q.kind === 'daily' ? collectDaily(file, q.id) : completeSideQuest(file, q.id)
    if (res.file === file) return
    play(q.kind === 'daily' ? 'damage' : 'rupee')
    commit(res.file, res.events)
  }

  const open = (q: Quest) => {
    play('cursor')
    setSheet(q.kind === 'dungeon' ? { type: 'dungeon', id: q.id } : { type: 'edit', id: q.id })
  }

  const save = (draft: Draft) => {
    if (sheet?.type === 'edit') commit(updateQuest(file, sheet.id, draft))
    else commit(addQuest(file, draft))
    setSheet(null)
  }

  const empty = dungeons.length + sides.length + dailies.length === 0

  return (
    <div className="screen world">
      <div className="sky" style={{ background: `linear-gradient(${info.sky[0]}, ${info.sky[1]} 70%)` }} />
      <svg className="land" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40C80 10 150 30 220 22s120-10 180 12V120H0Z" fill={info.ground} opacity=".7" />
        <path d="M0 70c90-25 170-10 250-18s110 6 150 0V120H0Z" fill={info.ground} />
      </svg>

      <Hud
        file={file}
        aLabel="New"
        bLabel={showDone ? 'Active' : 'Done'}
        onA={() => { play('select'); setSheet({ type: 'new' }) }}
        onB={() => { play('cursor'); setShowDone(!showDone) }}
        onStart={() => { play('open'); setPaused(true) }}
      />
      <div className="navi"><Fairy size={26} /></div>

      <div className="area-name outline">
        {info.name}
        <small>{area === 'field' ? 'All quests' : info.hint}</small>
      </div>

      <div className="log">
        {showDone ? (
          <>
            <div className="log-section">COMPLETED</div>
            {done.length === 0 && <div className="empty-log">No completed quests here yet.</div>}
            {done.map((q) => <QuestRow key={q.id} quest={q} onOpen={() => q.kind === 'dungeon' ? open(q) : undefined} onAct={() => undefined} />)}
          </>
        ) : empty ? (
          <div className="empty-log outline">
            <div className="fairy"><Fairy size={40} /></div>
            <p>No quests in {info.name} yet.<br />Press <span style={{ color: '#8fb6ff' }}>A</span> to take one on.</p>
          </div>
        ) : (
          <>
            {dungeons.length > 0 && <div className="log-section outline">DUNGEONS</div>}
            {dungeons.map((q) => <QuestRow key={q.id} quest={q} onOpen={() => open(q)} onAct={() => act(q)} />)}
            {sides.length > 0 && <div className="log-section outline">SIDE QUESTS</div>}
            {sides.map((q) => <QuestRow key={q.id} quest={q} onOpen={() => open(q)} onAct={() => act(q)} />)}
            {dailies.length > 0 && <div className="log-section outline">GOLD SKULLTULAS</div>}
            {dailies.map((q) => <QuestRow key={q.id} quest={q} onOpen={() => open(q)} onAct={() => act(q)} />)}
          </>
        )}
      </div>

      <AnimatePresence>
        {(sheet?.type === 'new' || editing) && (
          <QuestEditor
            key="editor"
            initial={editing}
            onSave={save}
            onDelete={editing ? () => { commit(removeQuest(file, editing.id)); setSheet(null) } : undefined}
            onClose={() => setSheet(null)}
          />
        )}
        {dungeon && (
          <DungeonView key="dungeon" quest={dungeon} onClose={() => setSheet(null)}
            onEdit={() => setSheet({ type: 'edit', id: dungeon.id })} />
        )}
      </AnimatePresence>

      <AnimatePresence>{paused && <PauseMenu key="pause" />}</AnimatePresence>

      {tip && (
        <TextBox
          speaker="Navi"
          pages={NAVI_TIPS[tip]}
          onDone={() => {
            commit(markTip(file, tip))
            setTip(null)
          }}
        />
      )}
    </div>
  )
}
