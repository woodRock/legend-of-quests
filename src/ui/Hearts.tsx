import { Heart } from './Icons'

export function Hearts({ health, containers, size = 22 }: { health: number; containers: number; size?: number }) {
  const low = health > 0 && health <= 4
  return (
    <div className={`hearts${low ? ' low' : ''}`} aria-label={`${health / 4} of ${containers} hearts`}>
      {Array.from({ length: containers }, (_, i) => (
        <Heart key={i} size={size} quarters={Math.max(0, Math.min(4, health - i * 4))} />
      ))}
    </div>
  )
}
