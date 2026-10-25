import { areaById } from './areas'
import { SIDE_QUESTS_PER_PIECE } from './logic'
import type { GameEvent, ItemId } from './types'

export const ITEM_TEXT: Record<ItemId, { name: string; text: string }> = {
  'kokiri-sword': {
    name: 'Kokiri Sword',
    text: 'You got the |Kokiri Sword|! Your first quest is done. This is only the beginning of your adventure.',
  },
  'deku-shield': {
    name: 'Deku Shield',
    text: 'You got a |Deku Shield|! Five quests complete. You are getting the hang of this.',
  },
  'kokiri-emerald': {
    name: 'Kokiri Emerald',
    text: 'You got the |Kokiri Emerald|! The first Spiritual Stone. New paths have opened on the map.',
  },
  'goron-ruby': {
    name: 'Goron Ruby',
    text: 'You got the |Goron Ruby|! The second Spiritual Stone. One more remains...',
  },
  'zora-sapphire': {
    name: "Zora's Sapphire",
    text: "You got |Zora's Sapphire|! All three Spiritual Stones are yours. The Door of Time awaits...",
  },
  'adult-wallet': {
    name: "Adult's Wallet",
    text: "You got an |Adult's Wallet|! You can now carry up to |200| Rupees.",
  },
  'giant-wallet': {
    name: "Giant's Wallet",
    text: "You got a |Giant's Wallet|! You can now carry up to |500| Rupees.",
  },
}

/** Text for an event's dialog box. Words between pipes are highlighted red. */
export function eventText(e: GameEvent): string {
  switch (e.type) {
    case 'item': return ITEM_TEXT[e.item].text
    case 'piece': return `You got a |Piece of Heart|! Every ${SIDE_QUESTS_PER_PIECE} side quests earn one. Collect 4 to form a new Heart Container.`
    case 'container': return 'You got a |Heart Container|! Your life energy has increased and been fully replenished.'
    case 'key': return `You found a |Small Key|! Another room of ${e.dungeon} has been cleared.`
    case 'map': return `You found the |Dungeon Map| for ${e.dungeon}! The first room is behind you.`
    case 'compass': return `You found the |Compass|! You are halfway through ${e.dungeon}.`
    case 'bossKey': return `You got the |Boss Key|! Every room of ${e.dungeon} is clear. The boss awaits...`
    case 'token': return `You destroyed a Gold Skulltula. You got a token proving it! You have |${e.total}| tokens.`
    case 'area': return `A new area has appeared on your map: |${areaById(e.area).name}|.`
    case 'damage': return `Ouch! ${e.overdue} overdue ${e.overdue === 1 ? 'quest has' : 'quests have'} worn you down. Finish quests to recover your hearts.`
    case 'rupees':
    case 'heal':
    case 'gameOver':
      return ''
  }
}

/** Events that interrupt play with a full item-get box; the rest just animate the HUD. */
export const isBigEvent = (e: GameEvent) => !['rupees', 'heal', 'gameOver'].includes(e.type)

export const NAVI_TIPS = {
  welcome: [
    'Hey! Listen!',
    "I'm Navi, your fairy! Every task you take on is a |quest|. Finish quests to earn |Rupees|, recover |hearts| and grow stronger.",
    'Tap the |A| button to take on your first quest. Big projects can be |dungeons|, with rooms to clear before you face the |boss|!',
  ],
  overdue: [
    'Hey! Listen! Quests left |overdue| will chip away at your hearts each day. Keep an eye on them!',
  ],
  daily: [
    'Watch out! |Gold Skulltulas| are daily habits. Defeat one each day to collect its token. Gather enough and something good might happen!',
  ],
}
