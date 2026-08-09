# Content Guide

Doll City content is data, not code. This is what makes "add 200 more outfits" or "add a
20th building" a data-entry task instead of a refactor. This guide is the practical
companion to the entity types in `src/types/entities.ts`.

Every entity extends `BaseEntity`:

| Field              | Meaning                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | Stable, unique, never reused. Referenced by saves — do not rename or delete a shipped id.                                                 |
| `type`             | One of the `EntityType` union values (`'character' \| 'outfit' \| ...`).                                                                  |
| `name`             | Display name (kept short — the UI favors icons over text for young kids).                                                                 |
| `assetKey`         | Which placeholder-art shape/recolor to use (see `src/game/loaders/entityVisuals.ts`).                                                     |
| `thumbnail`        | Asset key used for small grid thumbnails (wardrobe/shop/admin).                                                                           |
| `tags`             | Free-form strings used for filtering/search (e.g. the dev Content Catalog's search box).                                                  |
| `category`         | A narrower grouping than `type` (e.g. outfit `category: 'formalDress'`).                                                                  |
| `zIndex`           | Layering hint for entities drawn as stacked sprites (characters/accessories).                                                             |
| `interactionTypes` | Which interactions apply (`'drag' \| 'wear' \| 'hold' \| 'sit' \| 'enter' \| 'open' \| 'tidy' \| 'store'`).                               |
| `isDefault`        | Whether this is a character's starting pick (outfit/hair) — not a wardrobe-visibility gate; the full seeded wardrobe is always browsable. |
| `isCollectible`    | Marks "extra" content (vs. one of the small set of basics every character starts with).                                                   |
| `isMovable`        | Whether it can be dragged in the world.                                                                                                   |
| `createdAt`        | Static content stamp (`SEED_CREATED_AT`), not a live timestamp.                                                                           |

## Adding an outfit

`src/data/outfits.ts`:

```ts
outfit({
  id: 'winter_coat_01',
  name: 'Cozy Winter Coat',
  category: 'sweater', // or 'dress' | 'formalDress' | 'shirt' | 'pants' | 'shoes' | 'formalWear' | 'childrensWear' | 'grandmotherStyle' | 'festive'
  assetKey: 'outfit_winter_coat',
  thumbnail: 'outfit_winter_coat',
  tags: ['winter', 'cozy'],
  zIndex: 20,
  interactionTypes: ['wear'],
  isDefault: false,
  isCollectible: true,
  isMovable: true,
  primaryColor: '#4DB8FF',
  secondaryColor: '#FFFFFF',
  fitsArchetypes: ['child', 'mother', 'father'],
});
```

It appears in the wardrobe grid automatically for any character whose `archetype` is in
`fitsArchetypes`. `assetKey`/`thumbnail` don't need a matching hand-drawn asset yet —
`entityVisuals.ts` maps outfit _category_ to one of a few reusable placeholder shapes
(`outfitDress` for dresses/formal/festive wear, `outfitShirt` otherwise), tinted by
`primaryColor`/`secondaryColor`. Swap in real art later by changing that one mapping
function — no component needs to change.

## Adding a character

`src/data/characters.ts` — pick an `archetype`
(`baby | small_child | child | mother | father | grandmother | grandfather`), a
`skinTone`, and starting `defaultOutfitId`/`defaultHairId`. Then decide where it starts:
add it to `HOUSE_CHARACTER_POSITIONS` or `SHOP_CHARACTER_POSITIONS` in
`src/lib/persistence/defaultState.ts` (or leave it out — it'll simply have no
`buildingId` until a future building places it).

Per the product rules, characters don't get a skin-tone/identity editor in normal
gameplay — only hair, hair color, and accessories are player-changeable (see
`docs/GAME-RULES.md`).

## Adding hair / an accessory

`src/data/hair.ts` / `src/data/accessories.ts`. Accessories declare a `slot`
(`glasses | earrings | hairAccessory | faceAccessory | bag`); `src/game/systems/attachment.ts`
routes a slot to the matching field on `CharacterOutfitState` (`glassesId`, `earringsId`,
...), so a new accessory just needs the right `slot` — no new attach code.

## Adding a pet

`src/data/pets.ts` — `species: 'dog' | 'cat'` picks the placeholder ear shape
(`entityVisuals.ts`); everything else (`primaryColor`, `canBeCarried`) is generic.

## Adding furniture

`src/data/furniture.ts` — set `category` (`seating | table | storage | decor`) and
`footprint` (its drag hit-box / display size in pixels). To add it to a room's default
layout (what "Reset Room" restores), add a `PlacedItem` entry to the relevant
`RoomEntity.defaultLayout` in `src/data/buildings.ts`.

## Adding a building

See the README's "How to add a new building" section — the short version is a
`BuildingEntity` in `src/data/buildings.ts`, and either a real Phaser scene (registered in
`PhaserGame.tsx`) or `unlockState: 'locked'` for a map placeholder.

## Adding a gift

`src/data/gifts.ts` — `contentsItemType` + `contentsItemId` point at any existing outfit /
accessory / holdable item; `poolWeight` controls how often it's picked (see
`src/features/gifts/dailyGift.ts::pickGiftFromPool`). No changes needed to the gift scene.

## Adding a recipe

`src/data/recipes.ts` — `ingredientIds` (matched against a cooking station's placed
ingredients), `resultItemId` (any `FoodEntity` id), `stationType`, `animationKey`. Only one
demo recipe ships in the MVP; the cooking _scene_ is future work, but the data model and
matching logic are meant to need zero changes when it arrives.

## The dev Content Catalog

Run `npm run dev` and visit `/admin/catalog` (development mode only) for a live,
searchable table of every seeded entity — the fastest way to confirm a new content entry
is wired up correctly before touching any UI.
