/**
 * Central, versioned save schema. `CURRENT_SAVE_VERSION` + `migrateSave` (see
 * lib/persistence/migrations.ts) let us evolve this shape over time without
 * breaking old saves.
 */

export const CURRENT_SAVE_VERSION = 1;

export interface Vector2 {
  x: number;
  y: number;
}

export interface CharacterOutfitState {
  outfitId: string;
  hairId: string;
  hairColor: string;
  glassesId: string | null;
  earringsId: string | null;
  hairAccessoryId: string | null;
  faceAccessoryId: string | null;
  heldItemId: string | null;
}

export interface CharacterSaveState {
  characterId: string;
  buildingId: string;
  position: Vector2;
  outfitState: CharacterOutfitState;
}

export interface PetSaveState {
  petId: string;
  buildingId: string;
  position: Vector2;
  carriedByCharacterId: string | null;
}

export interface FurnitureSaveState {
  instanceId: string;
  furnitureId: string;
  buildingId: string;
  roomId: string;
  position: Vector2;
  rotation: number;
}

export interface EditableHouseState {
  buildingId: string;
  furniture: FurnitureSaveState[];
  hasCustomLayout: boolean;
}

export interface GiftStorageEntry {
  giftInstanceId: string;
  giftId: string;
  storedAt: string;
}

export interface GiftClaimState {
  lastGiftDate: string | null;
  pendingGiftId: string | null;
  pendingGiftInstanceId: string | null;
  isOpened: boolean;
  storage: GiftStorageEntry[];
}

export interface ShopState {
  /** Which shop item instance currently sits in the dressing booth, if any. */
  dressingBoothCharacterId: string | null;
  dressingBoothState:
    | 'EMPTY'
    | 'CHARACTER_INSIDE'
    | 'OUTFIT_SELECTED'
    | 'CURTAIN_CLOSING'
    | 'CHANGING'
    | 'CURTAIN_OPENING'
    | 'COMPLETE';
  dressingBoothSelectedOutfitId: string | null;
}

export interface GameState {
  saveVersion: typeof CURRENT_SAVE_VERSION;
  playerId: string;
  characters: Record<string, CharacterSaveState>;
  pets: Record<string, PetSaveState>;
  editableHouse: EditableHouseState;
  shop: ShopState;
  gifts: GiftClaimState;
  unlockedContent: string[];
  updatedAt: string;
}

export interface GameStateAnyVersion {
  saveVersion: number;
  [key: string]: unknown;
}
