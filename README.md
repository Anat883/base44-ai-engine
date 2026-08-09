# Doll City (עיר הבובות)

Doll City is a colorful, open-ended 2D dollhouse/sandbox game for children. There's no
winning or losing — kids create stories by moving characters around, dressing them up,
decorating rooms, playing with pets, and opening gifts.

This repo contains the **MVP vertical slice**: a Doll City map, one customizable house,
one clothing shop with a working dressing booth, and a gift area — plus the underlying
architecture (entity system, save system, Supabase sync) built to support many more
buildings and content packs later.

> The `base44_new.py` / `requirements.txt` files at the repo root are an earlier,
> unrelated Streamlit prototype kept for reference. They are not part of Doll City.

## What's in the MVP

- **Doll City map** — tap a building to enter it; locked "coming soon" buildings preview
  the future world (~20 houses, ~12 shops).
- **My House** (customizable) — draggable furniture, a dog and a cat, Tidy Up / Reset Room.
- **Rainbow Threads** (clothing shop) — a wardrobe tab (outfits/hair/accessories) and a
  dressing booth with a real curtain-close → swap → curtain-open animation, driven by an
  explicit state machine.
- **Gift Garden** — one gift per calendar day, a permanent gift shelf you can store/retrieve
  gifts on.
- Seven starter characters across ages (baby → grandparent), 5 outfits, 7 hairstyles,
  5 accessories, 2 pets, 5 holdable items, 9 furniture pieces, 4 daily gifts, and a demo
  cooking recipe — all defined as plain data (see [Content Guide](docs/CONTENT-GUIDE.md)).
- Local-first save (IndexedDB) that works before any backend is configured, with optional
  Supabase anonymous-auth cloud sync layered on top.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full breakdown. Short version:

- **React + TypeScript + Vite** for the app shell, routing, and all menus/overlays.
- **Phaser 3** owns the interactive 2D world (one scene active at a time; React overlays
  render on top for wardrobe/tidy-up/gift UI).
- **Zustand** holds the single source of truth game state; Phaser scenes subscribe to it
  and React components read it via hooks — neither writes past the store.
- All game content (characters, outfits, hair, pets, furniture, buildings, gifts, recipes)
  is **data**, not code — see `src/data/`. New content ships as new records, not new logic.
- All placeholder art is generated at runtime from simple original vector shapes
  (`src/game/loaders/shapeTextures.ts`) — no external image assets, nothing copied from any
  other product.

## Prerequisites

- Node.js 20+ and npm
- (Optional) A [Supabase](https://supabase.com) project, for cloud save sync

## Install & run

```bash
npm install
npm run dev       # http://localhost:5173 - works fully offline, no setup needed
```

## Other commands

```bash
npm run build      # production build (tsc + vite build)
npm run preview    # preview the production build
npm run lint        # eslint
npm run format      # prettier --write
npm run typecheck   # tsc --noEmit
npm run test         # vitest (unit tests)
npm run test:watch  # vitest --watch
npm run test:e2e    # playwright (builds + serves the app first)
```

## Supabase setup (optional)

The game is fully playable without Supabase — it saves to IndexedDB locally. To add cloud
sync for a returning anonymous player:

1. Create a Supabase project.
2. In the SQL editor (or via the CLI), run the migrations in `supabase/migrations/` in
   order. They create `profiles` and `game_saves` (both RLS-protected, keyed off
   `auth.uid()`) and a generic `content_items` catalog table for future content packs.
3. In **Authentication → Providers**, enable **Anonymous Sign-ins**.
4. Copy `.env.example` to `.env.local` and fill in your project's URL and
   **publishable/anon** key (never the service-role key — that must never reach the
   browser):

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

5. Restart `npm run dev`. On load, the game silently signs in anonymously and syncs the
   local save to `game_saves`. If Supabase is unreachable at any point, the game keeps
   working locally and retries later — nothing blocks on the network.

### Database migration instructions

```bash
# using the Supabase CLI, from the project root
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/*.sql
supabase db reset         # (local dev only) re-applies migrations + supabase/seed.sql
```

RLS guarantees a player can only ever read/write the `game_saves` row where
`user_id = auth.uid()` — the client never gets to claim an arbitrary user id.

## Content architecture

Everything a player can see/use is a plain data record with a stable `id` (see
[`src/types/entities.ts`](src/types/entities.ts) and [`docs/CONTENT-GUIDE.md`](docs/CONTENT-GUIDE.md)).
In dev mode, visit `/admin/catalog` for a searchable list of every seeded item — proof
the game is data-driven, not a prototype for a future creator dashboard.

### How to add a new outfit

Add an entry to `src/data/outfits.ts` with a unique `id`, `category`, `primaryColor` /
`secondaryColor`, and `fitsArchetypes`. It shows up in the wardrobe automatically —
no UI or game-logic changes required.

### How to add a new character

Add an entry to `src/data/characters.ts` (`archetype`, `skinTone`, `defaultOutfitId`,
`defaultHairId`, ...), then give it a starting position in
`src/lib/persistence/defaultState.ts` (or leave it unplaced until a future building
introduces it).

### How to add a new building

1. Add a `BuildingEntity` to `src/data/buildings.ts` (`kind: 'fixed' | 'customizable'`,
   `mapPosition`, `sceneAsset`, `unlockState: 'unlocked'` to make it enterable).
2. If it's playable now, create a Phaser scene in `src/game/scenes/`, register it in
   `src/game/PhaserGame.tsx`, and point `sceneAsset` at its scene key.
3. If it's a future placeholder, leave `unlockState: 'locked'` — it renders as a friendly
   "coming soon" bubble on the map with zero extra code.

### How to add a new gift

Add a `GiftEntity` to `src/data/gifts.ts` with `contentsItemId` / `contentsItemType` and a
`poolWeight` (higher = more likely). It joins the daily gift pool automatically.

### How to add a recipe

Add a `RecipeEntity` to `src/data/recipes.ts` (`ingredientIds`, `resultItemId`,
`stationType`, `animationKey`). The cooking system (`src/features/cooking/`) is built to
read this list — no core code changes needed. Only one demo recipe ships in the MVP.

## Known MVP limitations

- Only 3 of the eventual ~32 buildings are implemented (house, clothing shop, gift area);
  the rest render as locked map placeholders.
- Cooking has a data model and one demo recipe, but no dedicated Phaser scene yet.
- Placeholder art is procedurally-drawn simple shapes, not final illustrations.
- No localization system yet (UI copy is English; the product name is bilingual).
- `content_items` (the Supabase content catalog table) exists for future
  creator/admin tooling but isn't yet read by the client — the MVP reads its seed content
  from bundled `src/data`.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system overview, data flow, save model.
- [`docs/CONTENT-GUIDE.md`](docs/CONTENT-GUIDE.md) — the entity system and how to add content.
- [`docs/GAME-RULES.md`](docs/GAME-RULES.md) — product rules (no fail states, privacy, etc.)
  and how they're enforced in code.
