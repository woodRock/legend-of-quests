import { AREAS } from './areas'
import type { AreaId, GameEvent, GameFile, ItemId, Quest, QuestSize } from './types'

export const RUPEE_VALUE: Record<QuestSize, number> = { small: 1, medium: 5, large: 20 }
export const SIDE_QUESTS_PER_PIECE = 5
export const STONES: ItemId[] = ['kokiri-emerald', 'goron-ruby', 'zora-sapphire']

export const today = (d = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 86_400_000)

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const walletMax = (f: GameFile) =>
  f.items.includes('giant-wallet') ? 500 : f.items.includes('adult-wallet') ? 200 : 99

export const maxHealth = (f: GameFile) => f.containers * 4

export const isOverdue = (q: Quest, day = today()) =>
  q.kind !== 'daily' && !q.doneAt && !!q.due && q.due < day

export const dailyDoneToday = (q: Quest, day = today()) => q.kind === 'daily' && q.lastDone === day

export function newFile(slot: number, name: string): GameFile {
  const now = Date.now()
  return {
    slot, name, createdAt: now, updatedAt: now,
    health: 12, containers: 3, pieces: 0, rupees: 0, skulltulas: 0,
    items: [], areas: ['field', 'kokiri'], quests: [],
    completed: 0, dungeonsCleared: 0, lastTick: today(), tips: [], deaths: 0,
    dailiesCounted: true,
  }
}

type Result = { file: GameFile; events: GameEvent[] }

const clone = (f: GameFile): GameFile => structuredClone(f)

function addRupees(f: GameFile, amount: number, events: GameEvent[]) {
  const max = walletMax(f)
  const before = f.rupees
  f.rupees = Math.min(max, f.rupees + amount)
  events.push({ type: 'rupees', amount, capped: before + amount > max })
}

function heal(f: GameFile, quarters: number, events: GameEvent[]) {
  const before = f.health
  f.health = Math.min(maxHealth(f), f.health + quarters)
  if (f.health > before) events.push({ type: 'heal', quarters: f.health - before })
}

function giveItem(f: GameFile, item: ItemId, events: GameEvent[]) {
  if (f.items.includes(item)) return
  f.items.push(item)
  events.push({ type: 'item', item })
}

/** Grants anything newly earned by the file's progress: equipment and new areas. */
function checkMilestones(f: GameFile, events: GameEvent[]) {
  if (f.completed >= 1) giveItem(f, 'kokiri-sword', events)
  if (f.completed >= 10) giveItem(f, 'deku-shield', events)
  for (const a of AREAS) {
    if (!f.areas.includes(a.id) && a.unlocked(f)) {
      f.areas.push(a.id)
      events.push({ type: 'area', area: a.id })
    }
  }
}

export function addQuest(file: GameFile, q: Omit<Quest, 'id' | 'createdAt'>): GameFile {
  const f = clone(file)
  f.quests.unshift({ ...q, id: uid(), createdAt: Date.now() })
  return f
}

export function updateQuest(file: GameFile, id: string, patch: Partial<Quest>): GameFile {
  const f = clone(file)
  f.quests = f.quests.map((q) => (q.id === id ? { ...q, ...patch } : q))
  return f
}

export function removeQuest(file: GameFile, id: string): GameFile {
  const f = clone(file)
  f.quests = f.quests.filter((q) => q.id !== id)
  return f
}

export function completeSideQuest(file: GameFile, id: string): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const q = f.quests.find((x) => x.id === id)
  if (!q || q.kind !== 'side' || q.doneAt) return { file, events }
  q.doneAt = Date.now()
  f.completed++
  addRupees(f, RUPEE_VALUE[q.size], events)
  heal(f, 4, events)
  const sideDone = f.quests.filter((x) => x.kind === 'side' && x.doneAt).length
  if (sideDone % SIDE_QUESTS_PER_PIECE === 0) grantPiece(f, events)
  checkMilestones(f, events)
  return { file: f, events }
}

function grantPiece(f: GameFile, events: GameEvent[]) {
  f.pieces++
  events.push({ type: 'piece' })
  if (f.pieces >= 4) {
    f.pieces -= 4
    f.containers++
    f.health = maxHealth(f)
    events.push({ type: 'container' })
  }
}

export function clearRoom(file: GameFile, questId: string, roomId: string): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const q = f.quests.find((x) => x.id === questId)
  const room = q?.rooms?.find((r) => r.id === roomId)
  if (!q || !q.rooms || !room || room.done) return { file, events }
  room.done = true
  const cleared = q.rooms.filter((r) => r.done).length
  const total = q.rooms.length
  if (cleared === total) events.push({ type: 'bossKey', dungeon: q.title })
  else if (cleared === 1) events.push({ type: 'map', dungeon: q.title })
  else if (cleared === Math.ceil(total / 2)) events.push({ type: 'compass', dungeon: q.title })
  else events.push({ type: 'key', dungeon: q.title })
  heal(f, 2, events)
  return { file: f, events }
}

export const bossDoorOpen = (q: Quest) => !!q.rooms && q.rooms.every((r) => r.done)

export function defeatBoss(file: GameFile, questId: string): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const q = f.quests.find((x) => x.id === questId)
  if (!q || q.kind !== 'dungeon' || q.doneAt || !bossDoorOpen(q)) return { file, events }
  q.doneAt = Date.now()
  f.completed++
  f.containers++
  f.health = maxHealth(f)
  events.push({ type: 'container' })
  const stone = STONES[f.dungeonsCleared]
  f.dungeonsCleared++
  if (stone) giveItem(f, stone, events)
  addRupees(f, 20, events)
  checkMilestones(f, events)
  return { file: f, events }
}

export function collectDaily(file: GameFile, id: string, day = today()): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const q = f.quests.find((x) => x.id === id)
  if (!q || q.kind !== 'daily' || q.lastDone === day) return { file, events }
  q.lastDone = day
  f.skulltulas++
  f.completed++
  events.push({ type: 'token', total: f.skulltulas })
  heal(f, 2, events)
  if (f.skulltulas >= 10) giveItem(f, 'adult-wallet', events)
  if (f.skulltulas >= 30) giveItem(f, 'giant-wallet', events)
  checkMilestones(f, events)
  return { file: f, events }
}

/**
 * Runs once per day: each quest left overdue chips a quarter heart off per day,
 * capped so a long absence never costs more than three hearts.
 */
export function dailyTick(file: GameFile, day = today()): Result {
  if (file.lastTick >= day) return { file, events: [] }
  const f = clone(file)
  const events: GameEvent[] = []
  const days = Math.min(7, Math.max(1, daysBetween(f.lastTick, day)))
  const overdue = f.quests.filter((q) => isOverdue(q, day)).length
  f.lastTick = day
  if (overdue > 0 && f.health > 0) {
    const quarters = Math.min(12, Math.min(overdue, 4) * days, f.health)
    f.health -= quarters
    events.push({ type: 'damage', quarters, overdue })
    if (f.health <= 0) events.push({ type: 'gameOver' })
  }
  return { file: f, events }
}

/**
 * Brings older saves up to date. Dailies didn't use to count as completed
 * quests, so tokens collected before then are credited once.
 */
export function migrateFile(file: GameFile): Result {
  if (file.dailiesCounted) return { file, events: [] }
  const f = clone(file)
  const events: GameEvent[] = []
  f.completed += f.skulltulas
  f.dailiesCounted = true
  checkMilestones(f, events)
  return { file: f, events }
}

export function continueGame(file: GameFile): GameFile {
  const f = clone(file)
  f.health = Math.min(12, maxHealth(f))
  f.deaths++
  return f
}

export function markTip(file: GameFile, tip: string): GameFile {
  if (file.tips.includes(tip)) return file
  const f = clone(file)
  f.tips.push(tip)
  return f
}

export const newAreas = (before: AreaId[], after: AreaId[]) => after.filter((a) => !before.includes(a))
