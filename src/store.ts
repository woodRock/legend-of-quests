import { create } from 'zustand'
import { backend, type Slots, type User } from './lib/backend'
import { continueGame, dailyTick, migrateFile, newFile } from './game/logic'
import type { AreaId, GameEvent, GameFile } from './game/types'

export type Screen = 'title' | 'login' | 'files' | 'name' | 'game'

/** A full-screen cover: fade to a colour, optionally showing an area's title card. */
export interface Transition {
  color: 'black' | 'white'
  area?: AreaId
  phase: 'in' | 'card' | 'out'
}

interface State {
  user: User | null | undefined
  slots: Slots
  slotsLoaded: boolean
  filesError: string | null
  /** Set when the last save was rejected; cleared by the next successful save. */
  saveError: boolean
  screen: Screen
  nameSlot: number | null
  file: GameFile | null
  area: AreaId
  events: GameEvent[]
  transition: Transition | null
  paused: boolean
  gameOver: boolean

  init(): void
  go(screen: Screen): void
  transitionTo(color: Transition['color'], mid: () => void, area?: AreaId): Promise<void>
  startFile(slot: number): void
  createFile(slot: number, name: string): void
  eraseFile(slot: number): Promise<void>
  commit(file: GameFile, events?: GameEvent[]): void
  shiftEvent(): void
  travel(area: AreaId): void
  setPaused(p: boolean): void
  continueAfterGameOver(): void
  quitToFiles(): void
  signOut(): Promise<void>
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
let initialized = false
let unwatchFiles: (() => void) | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useGame = create<State>((set, get) => {
  const save = (uid: string, file: GameFile) =>
    backend.saveFile(uid, file).then(
      () => set({ saveError: false }),
      (err) => {
        console.error('Save failed', err)
        set({ saveError: true })
      },
    )
  const flushSave = () => {
    const { user, file } = get()
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null
    if (user && file) void save(user.uid, file)
  }
  const queueSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(flushSave, 300)
  }
  window.addEventListener('pagehide', flushSave)

  /** Updates older saves, applies the once-a-day tick (overdue damage) and queues what they caused. */
  const tick = () => {
    const { file } = get()
    if (!file) return
    const migrated = migrateFile(file)
    const ticked = dailyTick(migrated.file)
    if (ticked.file !== file) get().commit(ticked.file, [...migrated.events, ...ticked.events])
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick()
  })

  return {
    user: undefined,
    slots: [null, null, null],
    slotsLoaded: false,
    filesError: null,
    saveError: false,
    screen: 'title',
    nameSlot: null,
    file: null,
    area: 'field',
    events: [],
    transition: null,
    paused: false,
    gameOver: false,

    init() {
      if (initialized) return
      initialized = true
      backend.onAuth((user) => {
        unwatchFiles?.()
        unwatchFiles = null
        set({ user, slotsLoaded: false, filesError: null })
        if (!user) {
          set({ slots: [null, null, null], file: null })
          return
        }
        unwatchFiles = backend.watchFiles(user.uid, (slots) => {
          set({ slots, slotsLoaded: true, filesError: null })
          // Another device saved this file more recently: take its version.
          const { file } = get()
          const incoming = file && slots[file.slot - 1]
          if (incoming && incoming.updatedAt > file.updatedAt) set({ file: incoming })
        }, (err) => {
          console.error('Could not load save files', err)
          set({ filesError: err.message })
        })
      })
    },

    go: (screen) => set({ screen }),

    async transitionTo(color, mid, area) {
      set({ transition: { color, area, phase: 'in' } })
      await wait(550)
      mid()
      if (area) {
        set({ transition: { color, area, phase: 'card' } })
        await wait(1900)
      }
      set({ transition: { color, area, phase: 'out' } })
      await wait(600)
      set({ transition: null })
    },

    startFile(slot) {
      const file = get().slots[slot - 1]
      if (!file) return
      void get().transitionTo(
        'white',
        () => {
          set({ file, screen: 'game', area: 'field', events: [], paused: false, gameOver: false })
          tick()
        },
        'field',
      )
    },

    createFile(slot, name) {
      const { user } = get()
      if (!user) return
      const file = newFile(slot, name)
      const slots = [...get().slots]
      slots[slot - 1] = file
      set({ slots, screen: 'files', nameSlot: null })
      void save(user.uid, file)
    },

    async eraseFile(slot) {
      const { user } = get()
      if (user) await backend.eraseFile(user.uid, slot)
    },

    commit(file, events = []) {
      const stamped = { ...file, updatedAt: Date.now() }
      const gameOver = events.some((e) => e.type === 'gameOver')
      set((s) => ({ file: stamped, events: [...s.events, ...events], gameOver: s.gameOver || gameOver }))
      queueSave()
    },

    shiftEvent: () => set((s) => ({ events: s.events.slice(1) })),

    travel(area) {
      if (area === get().area) return
      void get().transitionTo('black', () => set({ area, paused: false }), area)
    },

    setPaused: (paused) => set({ paused }),

    continueAfterGameOver() {
      const { file } = get()
      if (!file) return
      get().commit(continueGame(file))
      set({ gameOver: false, events: [] })
    },

    quitToFiles() {
      flushSave()
      void get().transitionTo('black', () =>
        set({ file: null, screen: 'files', paused: false, events: [], gameOver: false }),
      )
    },

    async signOut() {
      flushSave()
      await backend.signOut()
      set({ screen: 'title', file: null })
    },
  }
})
