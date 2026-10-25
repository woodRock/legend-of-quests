// Original synthesized menu sounds (no game audio is used).

let ctx: AudioContext | null = null
let muted = (() => {
  try {
    return localStorage.getItem('quests.muted') === '1'
  } catch {
    return false
  }
})()

const ac = () => {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

type Wave = OscillatorType

function tone(freq: number, start: number, dur: number, wave: Wave = 'square', vol = 0.08, slideTo?: number) {
  const c = ac()
  const t = c.currentTime + start
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

const notes = (seq: [number, number, number][], wave: Wave, vol: number) =>
  seq.forEach(([f, s, d]) => tone(f, s, d, wave, vol))

const SOUNDS = {
  cursor: () => tone(1320, 0, 0.05, 'square', 0.04),
  select: () => notes([[880, 0, 0.07], [1320, 0.06, 0.12]], 'square', 0.05),
  cancel: () => notes([[660, 0, 0.07], [440, 0.06, 0.12]], 'square', 0.05),
  text: () => tone(1800, 0, 0.02, 'triangle', 0.03),
  open: () => tone(220, 0, 0.25, 'sawtooth', 0.04, 880),
  close: () => tone(880, 0, 0.2, 'sawtooth', 0.03, 220),
  rupee: () => notes([[1568, 0, 0.08], [2093, 0.07, 0.18]], 'triangle', 0.08),
  heal: () => notes([[1047, 0, 0.1], [1319, 0.08, 0.1], [1568, 0.16, 0.2]], 'sine', 0.08),
  damage: () => tone(180, 0, 0.3, 'sawtooth', 0.08, 60),
  start: () => notes([[523, 0, 0.12], [784, 0.1, 0.12], [1047, 0.2, 0.4]], 'triangle', 0.1),
  // A short original rising fanfare for receiving something.
  item: () =>
    notes(
      [[392, 0, 0.18], [523, 0.16, 0.18], [659, 0.32, 0.18], [784, 0.48, 0.18], [1047, 0.64, 0.7]],
      'triangle',
      0.1,
    ),
  // Sparkle used for discoveries (new areas, boss door opening).
  discover: () =>
    notes(
      [[1175, 0, 0.12], [1397, 0.1, 0.12], [1760, 0.2, 0.12], [2349, 0.3, 0.12], [1760, 0.4, 0.12], [2349, 0.5, 0.5]],
      'sine',
      0.07,
    ),
  gameOver: () => notes([[392, 0, 0.4], [370, 0.4, 0.4], [349, 0.8, 0.4], [330, 1.2, 1]], 'triangle', 0.1),
}

export type Sound = keyof typeof SOUNDS

export function play(sound: Sound) {
  if (muted) return
  try {
    SOUNDS[sound]()
  } catch {
    /* audio unavailable */
  }
}

export const isMuted = () => muted
export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem('quests.muted', m ? '1' : '0')
  } catch {
    /* ignore */
  }
}
