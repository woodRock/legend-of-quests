import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
} from 'firebase/firestore'
import type { GameFile } from '../game/types'

export interface User {
  uid: string
  email: string | null
}

export type Slots = (GameFile | null)[]

export interface Backend {
  mode: 'cloud' | 'local'
  onAuth(cb: (u: User | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  register(email: string, password: string): Promise<void>
  signInWithGoogle?(): Promise<void>
  signOut(): Promise<void>
  watchFiles(uid: string, cb: (slots: Slots) => void, onError: (err: Error) => void): () => void
  saveFile(uid: string, file: GameFile): Promise<void>
  eraseFile(uid: string, slot: number): Promise<void>
}

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const toSlots = (files: GameFile[]): Slots =>
  [1, 2, 3].map((s) => files.find((f) => f.slot === s) ?? null)

function cloudBackend(app: FirebaseApp): Backend {
  const auth = getAuth(app)
  // Persistent cache: the quest log works offline and syncs when back online.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  const filesCol = (uid: string) => collection(db, 'users', uid, 'files')

  return {
    mode: 'cloud',
    onAuth: (cb) => onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null)),
    signIn: async (email, pw) => void (await signInWithEmailAndPassword(auth, email, pw)),
    register: async (email, pw) => void (await createUserWithEmailAndPassword(auth, email, pw)),
    signInWithGoogle: async () => void (await signInWithPopup(auth, new GoogleAuthProvider())),
    signOut: () => signOut(auth),
    watchFiles: (uid, cb, onError) =>
      onSnapshot(filesCol(uid), (snap) => cb(toSlots(snap.docs.map((d) => d.data() as GameFile))), onError),
    saveFile: (uid, file) => setDoc(doc(filesCol(uid), String(file.slot)), file),
    eraseFile: (uid, slot) => deleteDoc(doc(filesCol(uid), String(slot))),
  }
}

/**
 * Stand-in used until Firebase is configured: everything lives in this browser
 * only, and "accounts" are just a name for a set of save files.
 */
function localBackend(): Backend {
  const USER_KEY = 'quests.local.user'
  const filesKey = (uid: string) => `quests.local.files.${uid}`
  const authListeners = new Set<(u: User | null) => void>()
  const fileListeners = new Map<string, Set<(s: Slots) => void>>()

  const read = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  }
  const write = (key: string, value: unknown) => {
    try {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable: play continues in memory */
    }
  }
  const setUser = (u: User | null) => {
    write(USER_KEY, u)
    authListeners.forEach((cb) => cb(u))
  }
  const emitFiles = (uid: string) => {
    const slots = toSlots(read<GameFile[]>(filesKey(uid), []))
    fileListeners.get(uid)?.forEach((cb) => cb(slots))
  }
  const signIn = async (email: string) => {
    const clean = email.trim().toLowerCase()
    if (!clean.includes('@')) throw new Error('auth/invalid-email')
    setUser({ uid: 'local-' + clean, email: clean })
  }

  return {
    mode: 'local',
    onAuth: (cb) => {
      authListeners.add(cb)
      queueMicrotask(() => cb(read<User | null>(USER_KEY, null)))
      return () => authListeners.delete(cb)
    },
    signIn,
    register: signIn,
    signOut: async () => setUser(null),
    watchFiles: (uid, cb) => {
      if (!fileListeners.has(uid)) fileListeners.set(uid, new Set())
      fileListeners.get(uid)!.add(cb)
      queueMicrotask(() => cb(toSlots(read<GameFile[]>(filesKey(uid), []))))
      return () => fileListeners.get(uid)?.delete(cb)
    },
    saveFile: async (uid, file) => {
      const files = read<GameFile[]>(filesKey(uid), []).filter((f) => f.slot !== file.slot)
      write(filesKey(uid), [...files, file])
      emitFiles(uid)
    },
    eraseFile: async (uid, slot) => {
      write(filesKey(uid), read<GameFile[]>(filesKey(uid), []).filter((f) => f.slot !== slot))
      emitFiles(uid)
    },
  }
}

export const backend: Backend =
  config.apiKey && config.projectId ? cloudBackend(initializeApp(config)) : localBackend()
