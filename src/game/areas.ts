import type { AreaId, GameFile } from './types'

export interface Area {
  id: AreaId
  name: string
  /** What sort of quests belong here; shown as a hint when choosing an area. */
  hint: string
  /** Sky / ground colours for the area's backdrop. */
  sky: [string, string]
  ground: string
  /** Describes when the area opens up, for the locked map. */
  unlock: string
  unlocked: (f: GameFile) => boolean
}

export const AREAS: Area[] = [
  {
    id: 'field', name: 'Hyrule Field', hint: 'Anything and everything',
    sky: ['#3d6fb6', '#a9d4f5'], ground: '#4f8a3a',
    unlock: 'Always open', unlocked: () => true,
  },
  {
    id: 'kokiri', name: 'Kokiri Forest', hint: 'Home and chores',
    sky: ['#1f4a2c', '#6fa36b'], ground: '#2f5d24',
    unlock: 'Always open', unlocked: () => true,
  },
  {
    id: 'kakariko', name: 'Kakariko Village', hint: 'Errands and appointments',
    sky: ['#8d5a3a', '#f0c48a'], ground: '#7a6440',
    unlock: 'Complete 10 quests', unlocked: (f) => f.completed >= 10,
  },
  {
    id: 'castle', name: 'Hyrule Castle Town', hint: 'Work and career',
    sky: ['#4a3c7a', '#c7b6e8'], ground: '#6d6a74',
    unlock: 'Complete 25 quests', unlocked: (f) => f.completed >= 25,
  },
  {
    id: 'lonlon', name: 'Lon Lon Ranch', hint: 'Friends and family',
    sky: ['#d9774a', '#ffd9a0'], ground: '#8a9c3a',
    unlock: 'Complete 50 quests', unlocked: (f) => f.completed >= 50,
  },
  {
    id: 'mountain', name: 'Death Mountain', hint: 'Fitness and health',
    sky: ['#5a1e14', '#e0703a'], ground: '#5b3a2a',
    unlock: 'Clear your first dungeon', unlocked: (f) => f.dungeonsCleared >= 1,
  },
  {
    id: 'zora', name: "Zora's Domain", hint: 'Rest and self-care',
    sky: ['#0e3d6b', '#6cc7e8'], ground: '#2a6f8f',
    unlock: 'Clear two dungeons', unlocked: (f) => f.dungeonsCleared >= 2,
  },
  {
    id: 'lake', name: 'Lake Hylia', hint: 'Learning and study',
    sky: ['#14507a', '#9be0e0'], ground: '#3a8a7a',
    unlock: 'Complete 100 quests', unlocked: (f) => f.completed >= 100,
  },
  {
    id: 'gerudo', name: 'Gerudo Valley', hint: 'Money and admin',
    sky: ['#a8501e', '#f5c46a'], ground: '#b07a3a',
    unlock: 'Clear three dungeons', unlocked: (f) => f.dungeonsCleared >= 3,
  },
]

export const areaById = (id: AreaId): Area => AREAS.find((a) => a.id === id) ?? AREAS[0]
