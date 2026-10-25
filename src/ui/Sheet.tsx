import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/** Bottom sheet with a dimmed backdrop; tapping the backdrop closes it. */
export function Sheet({ children, onClose, className = '' }: { children: ReactNode; onClose: () => void; className?: string }) {
  return (
    <>
      <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className={`sheet ${className}`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        {children}
      </motion.div>
    </>
  )
}
