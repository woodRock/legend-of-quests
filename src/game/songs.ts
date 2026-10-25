import type { GameFile, SongId } from './types'

/** The five ocarina buttons. Melodies below are original, not the game's tunes. */
export type Note = 'A' | 'down' | 'right' | 'left' | 'up'

export const NOTE_FREQ: Record<Note, number> = {
  A: 293.66, down: 349.23, right: 440, left: 493.88, up: 587.33,
}

export interface Song {
  id: SongId
  name: string
  notes: Note[]
  /** What playing it does, shown in the ocarina menu. */
  effect: string
  /** How it's learned, shown while it's still locked. */
  unlock: string
  learned: (f: GameFile) => boolean
  color: string
}

export const OCARINA_AT = 3

export const SONGS: Song[] = [
  {
    id: 'zelda', name: "Zelda's Lullaby", notes: ['A', 'up', 'right', 'up', 'left'],
    effect: 'Focus: show only what is overdue, due today, or a daily left to do.',
    unlock: 'Complete 6 quests', learned: (f) => f.completed >= 6, color: '#c084fc',
  },
  {
    id: 'epona', name: "Epona's Song", notes: ['right', 'right', 'up', 'A', 'down'],
    effect: 'Gallop through quick-adding quests. Also adds a C button to the main screen.',
    unlock: 'Complete 15 quests', learned: (f) => f.completed >= 15, color: '#fb923c',
  },
  {
    id: 'time', name: 'Song of Time', notes: ['A', 'right', 'A', 'left', 'up'],
    effect: 'Undo a recent completion, or push overdue quests to tomorrow.',
    unlock: 'Clear your first dungeon', learned: (f) => f.dungeonsCleared >= 1, color: '#60a5fa',
  },
  {
    id: 'saria', name: "Saria's Song", notes: ['down', 'left', 'up', 'left', 'down'],
    effect: 'Saria suggests which quest to take on next.',
    unlock: 'Complete 20 quests', learned: (f) => f.completed >= 20, color: '#4ade80',
  },
  {
    id: 'sun', name: "Sun's Song", notes: ['up', 'up', 'right', 'down', 'A'],
    effect: "Review the day: overdue, due today, dailies left and tomorrow's quests.",
    unlock: 'Complete 30 quests', learned: (f) => f.completed >= 30, color: '#facc15',
  },
  {
    id: 'storms', name: 'Song of Storms', notes: ['down', 'A', 'down', 'up', 'up'],
    effect: 'Once a week: wash every overdue quest to today and restore all hearts.',
    unlock: 'Complete 40 quests', learned: (f) => f.completed >= 40, color: '#94a3b8',
  },
]

export const songById = (id: SongId): Song => SONGS.find((s) => s.id === id)!

export const STORMS_RECHARGE_DAYS = 7
