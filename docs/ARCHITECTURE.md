# Architecture

## Layering

```
React (src/app, src/components, src/features/*, src/admin)
  - routing, menus, overlays, wardrobe UI, tidy/reset buttons, gift UI
  - reads/writes game state via the Zustand store (src/store/gameStore.ts)
        |
        v
Zustand store (src/store/gameStore.ts)
  - single source of truth for GameState (src/types/save.ts)
  - every mutation goes through one action -> persistAndSet() -> debounced save
        |
        v
Phaser (src/game/*)
  - one Game instance, one active Scene at a time (src/game/PhaserGame.tsx)
  - scenes read initial state from the store, subscribe to future changes,
    and call store actions on drag/tap - never hold their own copy of truth
        |
        v
Persistence (src/lib/persistence, src/lib/supabase)
  - local-first: IndexedDB always works
  - optional: anonymous-auth Supabase sync layered on top, best-effort
```

Neither layer reaches around the store: React never touches Phaser objects directly, and
Phaser scenes never render React components. The `EventBus` (`src/game/EventBus.ts`) and
`gameController` (`src/game/gameController.ts`) are the only two points where the two
worlds talk to each other:

- `EventBus` — scenes emit `scene:changed` on `create()`; React listens
  (`useCurrentScene`) to decide which overlay to render.
- `gameController` — holds the live `Phaser.Game` instance so a React button (the "back to
  map" icon) can tell the world to switch scenes.

## Why one Phaser.Game instance, not one per screen

The game stays mounted for the whole session; navigating between buildings calls
`scene.stop()` on the current scene and `scene.start()` on the next one. Phaser tears down
the stopped scene's listeners and game objects (each scene wires its cleanup via
`this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)`), so only one
building's assets/subscriptions are ever live — this is what "lazy-load building scenes"
and "avoid rendering the entire city interiors simultaneously" mean in practice here.

## The entity system

Every piece of content — a character, an outfit, a piece of furniture, a building — is a
plain object matching one of the interfaces in `src/types/entities.ts`, all sharing a
`BaseEntity` shape (`id`, `type`, `name`, `assetKey`, `tags`, ...). Seed data lives in
`src/data/*.ts`; `src/data/index.ts` indexes everything by id for O(1) lookup
(`outfitsById.get(id)`, etc.) and exposes `ALL_CONTENT` for the dev catalog.

Nothing in game logic switches on a hardcoded id (e.g. `if (id === 'fancy_dress_01')`).
Behavior is driven by entity _fields_ (`category`, `slot`, `fitsArchetypes`, `species`, ...)
so new content never requires new code — see `docs/CONTENT-GUIDE.md`.

## Placeholder art

There are no external image/audio assets. `src/game/loaders/shapeTextures.ts` draws a small
library of plain white silhouette shapes once per texture key
(`Phaser.GameObjects.Graphics.generateTexture`) — a head circle, a body capsule, a hair
shape, a gift box, and so on. Every entity re-tints the _same_ cached texture at runtime via
`setTint(colorFromEntityData)` instead of generating a new texture per color. This keeps
the whole game's visual identity 100% original, avoids any risk of copying another
product's art, and means adding a new colored variant of an item is a data change, not an
asset-pipeline change. Sound (`src/lib/sound.ts`) follows the same idea: a handful of short
procedural Web Audio tones instead of shipped audio files.

## Game state & save model

`GameState` (`src/types/save.ts`) is the one typed shape covering everything that must
survive a reload: character positions/outfits, pet positions, the editable house's
furniture layout, the dressing-booth machine's state, and gift/claim data. It carries a
`saveVersion` (currently `1`); `src/lib/persistence/migrations.ts` is where a future
`0002_...` schema change would add an upgrader — unrecognized or corrupt saved data falls
back to `createDefaultGameState()` rather than crashing.

`GamePersistence` (`src/lib/persistence/GamePersistence.ts`) is a two-method interface
(`load`/`save`) implemented by:

- `LocalPersistence` — IndexedDB via the `idb` package. Always available.
- `SupabasePersistence` (`src/lib/supabase/`) — reads/writes the `game_saves` table,
  scoped by RLS to `auth.uid()`.

`src/lib/persistence/index.ts` (`initPersistence()`) is the only place that combines them:
it loads from both (Supabase only if configured + an anonymous session is obtained),
picks whichever is newer by `updatedAt`, and returns a debounced `save()` that always
writes locally and opportunistically writes to Supabase. Every Supabase call is wrapped in
try/catch and logs (dev-only) rather than throwing — the child is never blocked by a
network failure.

## The dressing-booth state machine

`src/game/interactions/dressingBoothMachine.ts` is a pure reducer
(`(state, event) -> state`) with no Phaser/React/store dependency, which is what makes it
independently unit-testable (`tests/unit/dressingBoothMachine.test.ts`). States:
`EMPTY -> CHARACTER_INSIDE -> OUTFIT_SELECTED -> CURTAIN_CLOSING -> CHANGING ->
CURTAIN_OPENING -> COMPLETE`. Events outside the current state's valid transitions are
no-ops (not crashes) — this is how "prevent invalid actions during animation" is enforced:
during `CURTAIN_CLOSING`/`CHANGING`/`CURTAIN_OPENING` only the one animation-driven event
can advance the state.

`ClothingShopScene` drives the animation (curtain tweens, sparkle particles) and, at each
step, dispatches the next event into `useGameStore().dispatchBoothEvent`. The store applies
the reducer and — exactly at the `CURTAIN_CLOSING -> CHANGING` transition, i.e. while the
character is hidden behind the closed curtain — swaps the character's `outfitId`. The
previous outfit is never "consumed": it simply stops being worn and remains selectable in
the wardrobe grid for anyone.

## Testing

- **Unit** (`tests/unit/`, Vitest): outfit swapping, the dressing-booth reducer,
  attachment-slot validation, save serialize/deserialize + version migration, daily-gift
  eligibility, and tidy/reset logic. All of these are pure functions/reducers with the
  Phaser/React layers deliberately kept out, so they run in milliseconds under jsdom.
- **E2E** (`tests/e2e/`, Playwright): the three flows called out in the product spec — the
  full dressing-room curtain flow, furniture position surviving a reload, and Clean Up
  restoring a messy shop. These drive the real canvas via mouse events mapped through the
  canvas's actual bounding box (Phaser's `Scale.FIT` means a "world" coordinate is not a
  1:1 screen pixel), and assert against the actual persisted IndexedDB record rather than
  pixels, which is both faster and less flaky than screenshot comparison.
