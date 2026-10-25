# The Legend of Quests

A todo app styled as an Ocarina of Time–style adventure, installable as a phone app (PWA).
It's a fan project: all the art and sounds are original, and it isn't affiliated with Nintendo.

```bash
npm install
npm run dev
```

Live at https://woodrock.github.io/legend-of-quests/ — GitHub Pages serves the `docs/` folder on `main`.
To publish changes, run `npm run build` (it writes to `docs/`) and commit the result.

## Saves and sync

- **Local mode** (default): with no Firebase config, saves stay in this browser and login only needs an email.
- **Cloud mode**: `.env.local` holds the config for the Firebase project `legend-of-quests-7k2m` (see `.env.example`). Login uses
  Firebase Auth (email/password + Google). Save files live in Firestore at `users/{uid}/files/{slot}`
  and work offline. Deploy `firestore.rules` so each user can only reach their own files.

## How play maps to tasks

| Game | Todo |
|---|---|
| Side quest (green / blue / red rupee) | A single task: small / medium / big |
| Dungeon → rooms → boss | A project → its steps → its final step |
| Gold Skulltula | A daily habit; counts as a completed quest, and tokens upgrade your wallet at 10 and 30 |
| Hearts | Each overdue quest costs ¼ heart a day; finishing quests heals |
| Piece of Heart | Every 5 side quests; 4 pieces make a Heart Container |
| Spiritual Stones | Your first three cleared dungeons |
| Areas | Quest categories: 10, 25, 50 and 100 completed quests, or 1–3 cleared dungeons |

Game rules live in `src/game/logic.ts`; screens are in `src/screens/`.
