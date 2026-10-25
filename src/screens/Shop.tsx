import { useState, type FormEvent } from 'react'
import {
  GOODS, addReward, buyGood, buyReward, goodBlocker, removeReward, rewardBlocker, walletMax, type GoodId,
} from '../game/logic'
import { play } from '../lib/sfx'
import { useGame } from '../store'
import { Bottle, Rupee } from '../ui/Icons'
import { Sheet } from '../ui/Sheet'

const GOOD_ICON: Record<GoodId, 'empty' | 'potion' | 'fairy'> = { bottle: 'empty', potion: 'potion', fairy: 'fairy' }

export function Shop({ name }: { name: string }) {
  const { file, commit, setMenu } = useGame()
  const [rewardName, setRewardName] = useState('')
  const [price, setPrice] = useState('')
  const [stocking, setStocking] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  if (!file) return null
  const max = walletMax(file)

  const buy = (res: ReturnType<typeof buyGood>) => {
    if (res.file === file) return play('cancel')
    play('buy')
    commit(res.file, res.events)
  }

  const stock = (e: FormEvent) => {
    e.preventDefault()
    const p = Number(price)
    if (!rewardName.trim() || !Number.isFinite(p) || p < 1) return play('cancel')
    play('select')
    commit(addReward(file, rewardName.trim(), p))
    setRewardName('')
    setPrice('')
    setStocking(false)
  }

  return (
    <Sheet className="shop" onClose={() => { play('cancel'); setMenu(null) }}>
      <h2 className="outline">{name}</h2>
      <div className="shop-wallet outline"><Rupee size={18} /> {file.rupees} <span className="note" style={{ margin: 0 }}>/ {max}</span></div>
      <p className="shopkeeper">"Welcome! Take a look around. If you see something you like, it's yours... for a price."</p>

      <div className="log-section">GOODS</div>
      {GOODS.map((g) => {
        const blocker = goodBlocker(file, g.id)
        return (
          <div key={g.id} className="shelf-item">
            <Bottle content={GOOD_ICON[g.id]} size={36} />
            <div className="shelf-main">
              <div>{g.name}</div>
              <div className="shelf-sub">{g.text}</div>
            </div>
            <button className="price-btn" disabled={!!blocker} onClick={() => buy(buyGood(file, g.id))}>
              <span><Rupee size={14} /> {g.price}</span>
              {blocker && <small>{blocker}</small>}
            </button>
          </div>
        )
      })}

      <div className="log-section">YOUR REWARDS</div>
      {(file.rewards ?? []).length === 0 && !stocking && (
        <p className="note" style={{ marginTop: 0 }}>Stock the shelves with treats you'd like to earn, like "an episode of a show" or "a fancy coffee".</p>
      )}
      {(file.rewards ?? []).map((r) => {
        const blocker = rewardBlocker(file, r)
        return (
          <div key={r.id} className="shelf-item">
            <Rupee size={30} color={r.price >= 100 ? 'purple' : r.price >= 20 ? 'red' : r.price >= 5 ? 'blue' : 'green'} />
            <div className="shelf-main">
              <div>{r.name}</div>
              {removing === r.id ? (
                <div className="shelf-sub">
                  Take it off the shelf?{' '}
                  <button className="hl" onClick={() => { play('cancel'); commit(removeReward(file, r.id)); setRemoving(null) }}>Remove</button>
                  {' · '}
                  <button onClick={() => setRemoving(null)}>Keep</button>
                </div>
              ) : (
                <button className="shelf-sub" onClick={() => { play('cursor'); setRemoving(r.id) }}>Remove…</button>
              )}
            </div>
            <button className="price-btn" disabled={!!blocker} onClick={() => buy(buyReward(file, r.id))}>
              <span><Rupee size={14} /> {r.price}</span>
              {blocker && <small>{blocker}</small>}
            </button>
          </div>
        )
      })}

      {stocking ? (
        <form className="panel" style={{ padding: 14, marginTop: 6 }} onSubmit={stock}>
          <label className="field-label" htmlFor="r-name">Reward</label>
          <input id="r-name" className="text-input" autoFocus value={rewardName} onChange={(e) => setRewardName(e.target.value)}
            placeholder="e.g. An episode of a show" />
          <label className="field-label" htmlFor="r-price">Price in rupees</label>
          <input id="r-price" className="text-input" type="number" inputMode="numeric" min={1} max={500}
            value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 50" />
          {Number(price) > max && <div className="error">Your wallet holds {max}. You'll need a bigger wallet to afford this.</div>}
          <div className="menu-row">
            <button type="button" className="pill" onClick={() => { play('cancel'); setStocking(false) }}>Cancel</button>
            <button className="pill gold">Stock it</button>
          </div>
        </form>
      ) : (
        <button className="pill small" style={{ width: '100%' }} onClick={() => { play('cursor'); setStocking(true) }}>+ Stock a reward</button>
      )}

      {(file.purchases ?? []).length > 0 && (
        <>
          <div className="log-section">RECENTLY BOUGHT</div>
          {(file.purchases ?? []).slice(0, 5).map((p) => (
            <div key={p.at} className="shelf-sub" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 4px' }}>
              <span>{p.name}</span>
              <span>{p.price} · {new Date(p.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          ))}
        </>
      )}

      <button className="pill" style={{ width: '100%', marginTop: 16 }} onClick={() => { play('cancel'); setMenu(null) }}>Leave shop</button>
    </Sheet>
  )
}
