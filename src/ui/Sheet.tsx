import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { play } from '../lib/sfx'

/**
 * A close button pinned to the top of a sheet while it scrolls. Bottom buttons can end up
 * under a phone's browser toolbar or home bar, so every sheet can always be closed from here.
 */
export function SheetClose({ onClose }: { onClose: () => void }) {
  return (
    <div className="sheet-close-bar">
      <button type="button" className="sheet-close" aria-label="Close" onClick={() => { play('cancel'); onClose() }}>×</button>
    </div>
  )
}

/** Bottom sheet with a dimmed backdrop; tapping the backdrop or the × closes it. */
export function Sheet({ children, onClose, className = '' }: { children: ReactNode; onClose: () => void; className?: string }) {
  return (
    <>
      <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className={`sheet ${className}`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <SheetClose onClose={onClose} />
        {children}
      </motion.div>
    </>
  )
}
