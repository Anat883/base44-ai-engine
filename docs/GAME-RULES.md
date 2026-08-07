# Game Rules

Product rules for Doll City, and where each one is actually enforced in code (so they
don't quietly rot as the codebase grows).

## No win/lose, no pressure

There is no score, timer, health, or fail state anywhere in the codebase — `GameState`
(`src/types/save.ts`) has no such field, and no scene has a "game over" branch. Every
interaction (dressing, moving furniture, opening a gift) is reversible or freely
repeatable. The dressing-booth machine (`dressingBoothMachine.ts`) _locks out_ invalid
input during its curtain animation, but that's an animation guard, not a fail state — it
simply ignores the event and stays in the same place.

## Characters keep their identity

Skin tone (`CharacterEntity.skinTone`) is fixed per character at content-authoring time —
there is no UI action anywhere that changes it. What players _can_ change: hairstyle
(`hairId`), hair color (a property of the chosen `HairEntity`), and accessories
(`glassesId`, `earringsId`, `hairAccessoryId`, `faceAccessoryId`) plus what's in their
hand (`heldItemId`) and what they're wearing (`outfitId`). See
`CharacterOutfitState` in `src/types/save.ts` — that struct _is_ the complete list of
what's player-editable about a character.

## Clothes are pre-designed, not painted

There is intentionally no drawing/painting surface anywhere in the game. Outfits are
selected from `src/data/outfits.ts`, never generated or customized pixel-by-pixel by the
player.

## Privacy: no personal information, ever

- No form anywhere in the app asks for a name, email, phone, birthdate, address, or photo.
  `main.tsx` renders straight into the game — there is no onboarding/signup screen.
- The only identifier that exists is an anonymous player id
  (`src/lib/persistence/playerId.ts`), a random UUID with no relation to any real-world
  identity, stored in `localStorage` purely so a returning player's local save can be
  found again.
- If Supabase is configured, auth is exclusively **anonymous sign-in**
  (`src/lib/supabase/auth.ts::ensureAnonymousSession`) — there is no email/password or
  OAuth flow in this codebase.
- `.env.example` only ever documents the public `VITE_SUPABASE_PUBLISHABLE_KEY` — a
  service-role key must never be added to a `VITE_*` variable, since Vite inlines those
  into the browser bundle.
- Supabase RLS policies (`supabase/migrations/0001_init.sql`) scope every row to
  `auth.uid()`; the client-supplied `user_id` in a save write is never trusted on its own —
  Postgres enforces the match server-side.
- No ads, no tracking SDK, no chat, no public profiles, and no user-generated content that
  gets shared with other players — this is a single-player local sandbox.

## No monetization in the MVP

There is no Stripe/payment integration, no subscription, no in-game currency, and no
loot-box/paid-random-reward mechanic anywhere in this codebase. The daily gift
(`src/features/gifts/dailyGift.ts`) is free, capped at one per calendar day, and drawn from
a fixed, fully-disclosed content pool — the antithesis of a paid loot box.

## Tidy Up vs. Reset Room (never lose player work by accident)

Two distinct, clearly-scoped actions in the editable house
(`src/features/furniture/roomReset.ts`):

- **Tidy Up** (`tidyPetsToDefault`) — nudges pets back to their usual spot. Instant, no
  confirmation, because it never discards anything the player arranged.
- **Reset Room** (`resetFurnitureToDefault`) — restores furniture to the room's designer
  default layout, _discarding_ the player's custom arrangement. The House overlay
  (`src/features/furniture/HouseControls.tsx`) always confirms this one first
  (`<Modal>` with an explicit Cancel/"Yes, reset").

The shop's analogous "Clean Up" (`useGameStore().cleanUpShop`) only touches
non-destructive state — wandered-off characters and a stuck dressing booth — so it never
needs a confirmation dialog either.

## Save data survives a reload, and never crashes on bad data

`src/lib/persistence/migrations.ts::migrateSave` is the single place old/corrupt/
unrecognized save data is handled: if it can't be understood, the player gets a fresh
default save (`createDefaultGameState`) rather than a broken screen. This is covered by
`tests/unit/save.test.ts`.

## Offline-first, never a technical error screen

`src/store/gameStore.ts::init()` wraps save loading in try/catch; on any failure the game
starts on an unsaved local session rather than showing an error. `SupabasePersistence`
(`src/lib/supabase/SupabasePersistence.ts`) swallows every network/DB error itself (dev-only
console warnings), so a flaky connection degrades to "still playable, just not synced" —
visible to an adult via the small "Playing offline" badge in `TopBar.tsx`, never as a raw
stack trace.
