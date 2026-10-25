import { useState, type FormEvent } from 'react'
import { backend } from '../lib/backend'
import { play } from '../lib/sfx'
import { useGame } from '../store'

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': "That doesn't look like a valid email.",
  'auth/invalid-credential': 'The email or password is wrong.',
  'auth/wrong-password': 'The email or password is wrong.',
  'auth/user-not-found': 'No adventurer is registered with that email.',
  'auth/email-already-in-use': 'An adventurer with that email already exists. Try continuing instead.',
  'auth/weak-password': 'Your password needs at least 6 characters.',
  'auth/network-request-failed': "Couldn't reach the server. Check your connection.",
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
}

const messageFor = (err: unknown) => {
  const code = (err as { code?: string; message?: string })?.code ?? (err as Error)?.message ?? ''
  return MESSAGES[code] ?? 'Something went wrong. Please try again.'
}

export function Login() {
  const { go, transitionTo } = useGame()
  const [mode, setMode] = useState<'continue' | 'register'>('continue')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const local = backend.mode === 'local'

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      play('select')
      void transitionTo('white', () => go('files'))
    } catch (err) {
      play('cancel')
      setError(messageFor(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run(() => (mode === 'register' ? backend.register(email, password) : backend.signIn(email, password)))
  }

  return (
    <div className="screen menu-bg">
      <div className="menu-title outline">{mode === 'register' ? 'Register Adventurer' : 'Welcome Back'}</div>
      <div className="menu-body">
        <form className="panel" style={{ padding: 18 }} onSubmit={submit}>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" className="text-input" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {!local && (
            <>
              <label className="field-label" htmlFor="pw">Password</label>
              <input id="pw" className="text-input" type="password" required minLength={6}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </>
          )}
          {error && <div className="error">{error}</div>}
          <button className="pill gold" style={{ width: '100%' }} disabled={busy}>
            {busy ? '…' : mode === 'register' ? 'Begin Adventure' : 'Continue'}
          </button>

          {backend.signInWithGoogle && (
            <>
              <div className="divider">or</div>
              <button type="button" className="pill" style={{ width: '100%' }} disabled={busy}
                onClick={() => void run(() => backend.signInWithGoogle!())}>
                Continue with Google
              </button>
            </>
          )}
        </form>

        {!local && (
          <p className="note">
            {mode === 'register' ? 'Already registered? ' : 'New to Hyrule? '}
            <button className="hl" type="button" onClick={() => { play('cursor'); setMode(mode === 'register' ? 'continue' : 'register'); setError('') }}>
              {mode === 'register' ? 'Continue your quest' : 'Register an adventurer'}
            </button>
          </p>
        )}
        {local && (
          <p className="note">
            Local mode: saves stay on this device until cloud sync is set up. No password needed.
          </p>
        )}
      </div>
    </div>
  )
}
