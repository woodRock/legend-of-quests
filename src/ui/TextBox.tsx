import { useEffect, useState } from 'react'
import { play } from '../lib/sfx'

/** Renders text where |words| between pipes are highlighted, like key words in game dialog. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('|').map((part, i) =>
        i % 2 ? (
          <span key={i} className="hl">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

/**
 * The classic dialog box: types out one page at a time; tap to finish the
 * page, tap again to advance. Calls onDone after the last page.
 */
export function TextBox({
  pages,
  onDone,
  speaker,
  position = 'bottom',
}: {
  pages: string[]
  onDone: () => void
  speaker?: string
  position?: 'bottom' | 'center'
}) {
  const [page, setPage] = useState(0)
  const [shown, setShown] = useState(0)
  const full = pages[page] ?? ''
  const plainLength = full.replace(/\|/g, '').length
  const done = shown >= plainLength

  useEffect(() => {
    setShown(0)
  }, [page])

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => {
      setShown((s) => s + 1)
      if (shown % 3 === 0) play('text')
    }, 22)
    return () => clearTimeout(t)
  }, [shown, done])

  const advance = () => {
    if (!done) return setShown(plainLength)
    play('cursor')
    if (page < pages.length - 1) setPage(page + 1)
    else onDone()
  }

  // Cut the rich text down to the number of visible characters.
  let remaining = shown
  const visible = full
    .split('|')
    .map((part) => {
      const take = part.slice(0, Math.max(0, remaining))
      remaining -= part.length
      return take
    })
    .join('|')

  return (
    <div className={`textbox-wrap ${position}`} onClick={advance}>
      <div className="textbox" role="dialog">
        {speaker && <div className="speaker">{speaker}</div>}
        <p>
          <Rich text={visible} />
        </p>
        {done && <span className={page < pages.length - 1 ? 'next-arrow' : 'end-square'} />}
      </div>
    </div>
  )
}
