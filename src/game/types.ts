export type AreaId =
  | 'field'
  | 'kokiri'
  | 'kakariko'
  | 'castle'
  | 'lonlon'
  | 'mountain'
  | 'zora'
  | 'lake'
  | 'gerudo'

export type QuestKind = 'side' | 'dungeon' | 'daily'

/** Side-quest size decides the rupee paid out: green, blue or red. */
export type QuestSize = 'small' | 'medium' | 'large'

export interface Room {
  id: string
  title: string
  done: boolean
}

export interface Quest {
  id: string
  kind: QuestKind
  title: string
  notes?: string
  area: AreaId
  size: QuestSize
  /** ISO date (yyyy-mm-dd). */
  due?: string
  createdAt: number
  doneAt?: number
  /** Dungeons only: the rooms to clear before the boss door opens. */
  rooms?: Room[]
  /** Dungeons only: the final task. */
  boss?: string
  /** Dailies only: the last day this Skulltula was collected. */
  lastDone?: string
}

export type ItemId =
  | 'kokiri-sword'
  | 'deku-shield'
  | 'kokiri-emerald'
  | 'goron-ruby'
  | 'zora-sapphire'
  | 'adult-wallet'
  | 'giant-wallet'

export interface GameFile {
  slot: number
  name: string
  createdAt: number
  updatedAt: number
  /** Health is tracked in quarter hearts, like the original. */
  health: number
  containers: number
  pieces: number
  rupees: number
  skulltulas: number
  items: ItemId[]
  areas: AreaId[]
  quests: Quest[]
  completed: number
  dungeonsCleared: number
  /** Last day the daily tick ran (damage for overdue quests, daily reset). */
  lastTick: string
  /** Navi tips already shown. */
  tips: string[]
  deaths: number
  /** Set once dailies count toward `completed` (older saves get tokens credited). */
  dailiesCounted?: boolean
}

/** Things that happen as a result of play, shown to the player one by one. */
export type GameEvent =
  | { type: 'rupees'; amount: number; capped: boolean }
  | { type: 'item'; item: ItemId }
  | { type: 'piece' }
  | { type: 'container' }
  | { type: 'key'; dungeon: string }
  | { type: 'map'; dungeon: string }
  | { type: 'compass'; dungeon: string }
  | { type: 'bossKey'; dungeon: string }
  | { type: 'token'; total: number }
  | { type: 'area'; area: AreaId }
  | { type: 'damage'; quarters: number; overdue: number }
  | { type: 'heal'; quarters: number }
  | { type: 'gameOver' }
