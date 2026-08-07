import { create } from 'zustand';
import type { GameState, Vector2 } from '@/types/save';
import {
  initPersistence,
  createDefaultGameState,
  type PersistenceSession,
} from '@/lib/persistence';
import { GIFTS, ROOMS, accessoriesById, holdableItemsById } from '@/data';
import { isDailyGiftAvailable, localDateKey, pickGiftFromPool } from '@/features/gifts/dailyGift';
import { resetFurnitureToDefault, tidyPetsToDefault } from '@/features/furniture/roomReset';
import { applyAccessory, detachAccessory } from '@/game/systems/attachment';
import type { AccessorySlot } from '@/types/entities';
import {
  dressingBoothReducer,
  INITIAL_BOOTH_STATE,
  type DressingBoothEvent,
} from '@/game/interactions/dressingBoothMachine';
import { SHOP_BUILDING_ID, SHOP_CHARACTER_POSITIONS } from '@/features/wardrobe/shopDefaults';

const DEFAULT_PET_POSITIONS: Record<string, Vector2> = {
  dog_01: { x: 200, y: 520 },
  cat_01: { x: 720, y: 500 },
};

interface GameStore {
  status: 'loading' | 'ready';
  cloudEnabled: boolean;
  offline: boolean;
  state: GameState;
  init: () => Promise<void>;

  moveCharacter: (characterId: string, buildingId: string, position: Vector2) => void;
  setCharacterOutfit: (characterId: string, outfitId: string) => void;
  setCharacterHair: (characterId: string, hairId: string) => void;
  attachAccessoryToCharacter: (characterId: string, accessoryId: string) => void;
  detachAccessoryFromCharacter: (characterId: string, slot: AccessorySlot) => void;
  setHeldItem: (characterId: string, itemId: string | null) => void;

  movePet: (petId: string, position: Vector2) => void;
  setPetCarried: (petId: string, characterId: string | null) => void;

  moveFurniture: (instanceId: string, position: Vector2, rotation?: number) => void;
  tidyHouse: () => void;
  resetHouse: () => void;

  dispatchBoothEvent: (event: DressingBoothEvent) => void;
  cleanUpShop: () => void;

  claimDailyGift: () => void;
  openPendingGift: () => void;
  storeGift: (giftInstanceId: string) => void;
  retrieveGift: (giftInstanceId: string) => void;
}

let persistence: PersistenceSession | null = null;

function persistAndSet(set: (partial: Partial<GameStore>) => void, next: GameState) {
  const updated = { ...next, updatedAt: new Date().toISOString() };
  set({ state: updated });
  persistence?.save(updated);
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: 'loading',
  cloudEnabled: false,
  offline: false,
  state: createDefaultGameState('bootstrapping'),

  init: async () => {
    try {
      const session = await initPersistence();
      persistence = session;
      set({
        state: session.state,
        status: 'ready',
        cloudEnabled: session.cloudEnabled,
        offline: false,
      });
    } catch (error) {
      console.warn('[gameStore] init failed, playing on an unsaved local session', error);
      set({ state: createDefaultGameState('offline-fallback'), status: 'ready', offline: true });
    }
  },

  moveCharacter: (characterId, buildingId, position) => {
    const state = get().state;
    const existing = state.characters[characterId];
    if (!existing) return;
    persistAndSet(set, {
      ...state,
      characters: {
        ...state.characters,
        [characterId]: { ...existing, buildingId, position },
      },
    });
  },

  setCharacterOutfit: (characterId, outfitId) => {
    const state = get().state;
    const existing = state.characters[characterId];
    if (!existing) return;
    persistAndSet(set, {
      ...state,
      characters: {
        ...state.characters,
        [characterId]: { ...existing, outfitState: { ...existing.outfitState, outfitId } },
      },
    });
  },

  setCharacterHair: (characterId, hairId) => {
    const state = get().state;
    const existing = state.characters[characterId];
    if (!existing) return;
    persistAndSet(set, {
      ...state,
      characters: {
        ...state.characters,
        [characterId]: { ...existing, outfitState: { ...existing.outfitState, hairId } },
      },
    });
  },

  attachAccessoryToCharacter: (characterId, accessoryId) => {
    const state = get().state;
    const existing = state.characters[characterId];
    const accessory = accessoriesById.get(accessoryId);
    if (!existing || !accessory) return;
    persistAndSet(set, {
      ...state,
      characters: {
        ...state.characters,
        [characterId]: {
          ...existing,
          outfitState: applyAccessory(existing.outfitState, accessory),
        },
      },
    });
  },

  detachAccessoryFromCharacter: (characterId, slot) => {
    const state = get().state;
    const existing = state.characters[characterId];
    if (!existing) return;
    persistAndSet(set, {
      ...state,
      characters: {
        ...state.characters,
        [characterId]: { ...existing, outfitState: detachAccessory(existing.outfitState, slot) },
      },
    });
  },

  setHeldItem: (characterId, itemId) => {
    if (itemId && !holdableItemsById.has(itemId)) return;
    const state = get().state;
    const existing = state.characters[characterId];
    if (!existing) return;
    persistAndSet(set, {
      ...state,
      characters: {
        ...state.characters,
        [characterId]: {
          ...existing,
          outfitState: { ...existing.outfitState, heldItemId: itemId },
        },
      },
    });
  },

  movePet: (petId, position) => {
    const state = get().state;
    const existing = state.pets[petId];
    if (!existing) return;
    persistAndSet(set, {
      ...state,
      pets: { ...state.pets, [petId]: { ...existing, position, carriedByCharacterId: null } },
    });
  },

  setPetCarried: (petId, characterId) => {
    const state = get().state;
    const existing = state.pets[petId];
    if (!existing) return;
    persistAndSet(set, {
      ...state,
      pets: { ...state.pets, [petId]: { ...existing, carriedByCharacterId: characterId } },
    });
  },

  moveFurniture: (instanceId, position, rotation) => {
    const state = get().state;
    const furniture = state.editableHouse.furniture.map((item) =>
      item.instanceId === instanceId
        ? { ...item, position, rotation: rotation ?? item.rotation }
        : item,
    );
    persistAndSet(set, {
      ...state,
      editableHouse: { ...state.editableHouse, furniture, hasCustomLayout: true },
    });
  },

  tidyHouse: () => {
    const state = get().state;
    persistAndSet(set, {
      ...state,
      pets: tidyPetsToDefault(state.pets, DEFAULT_PET_POSITIONS),
    });
  },

  resetHouse: () => {
    const state = get().state;
    const room = ROOMS.find((r) => r.buildingId === state.editableHouse.buildingId);
    if (!room) return;
    persistAndSet(set, {
      ...state,
      editableHouse: resetFurnitureToDefault(state.editableHouse, room),
      pets: tidyPetsToDefault(state.pets, DEFAULT_PET_POSITIONS),
    });
  },

  dispatchBoothEvent: (event) => {
    const state = get().state;
    const current = {
      state: state.shop.dressingBoothState,
      characterId: state.shop.dressingBoothCharacterId,
      selectedOutfitId: state.shop.dressingBoothSelectedOutfitId,
    };
    const next = dressingBoothReducer(current, event);

    let characters = state.characters;
    if (
      next.state === 'CHANGING' &&
      current.state !== 'CHANGING' &&
      next.characterId &&
      next.selectedOutfitId
    ) {
      const existing = characters[next.characterId];
      if (existing) {
        characters = {
          ...characters,
          [next.characterId]: {
            ...existing,
            outfitState: { ...existing.outfitState, outfitId: next.selectedOutfitId },
          },
        };
      }
    }

    persistAndSet(set, {
      ...state,
      characters,
      shop: {
        dressingBoothState: next.state,
        dressingBoothCharacterId: next.characterId,
        dressingBoothSelectedOutfitId: next.selectedOutfitId,
      },
    });
  },

  cleanUpShop: () => {
    const state = get().state;
    const characters = { ...state.characters };
    for (const [characterId, position] of Object.entries(SHOP_CHARACTER_POSITIONS)) {
      const existing = characters[characterId];
      if (existing && existing.buildingId === SHOP_BUILDING_ID) {
        characters[characterId] = { ...existing, position };
      }
    }
    persistAndSet(set, {
      ...state,
      characters,
      shop: {
        dressingBoothState: 'EMPTY',
        dressingBoothCharacterId: null,
        dressingBoothSelectedOutfitId: null,
      },
    });
  },

  claimDailyGift: () => {
    const state = get().state;
    if (!isDailyGiftAvailable(state.gifts.lastGiftDate, state.gifts.pendingGiftId)) return;
    const gift = pickGiftFromPool(GIFTS);
    persistAndSet(set, {
      ...state,
      gifts: {
        ...state.gifts,
        lastGiftDate: localDateKey(new Date()),
        pendingGiftId: gift.id,
        pendingGiftInstanceId: `${gift.id}__${Date.now()}`,
        isOpened: false,
      },
    });
  },

  openPendingGift: () => {
    const state = get().state;
    if (!state.gifts.pendingGiftId || state.gifts.isOpened) return;
    persistAndSet(set, {
      ...state,
      unlockedContent: state.unlockedContent.includes(state.gifts.pendingGiftId)
        ? state.unlockedContent
        : [...state.unlockedContent, state.gifts.pendingGiftId],
      gifts: { ...state.gifts, isOpened: true },
    });
  },

  storeGift: (giftInstanceId) => {
    const state = get().state;
    if (state.gifts.pendingGiftInstanceId !== giftInstanceId || !state.gifts.pendingGiftId) return;
    persistAndSet(set, {
      ...state,
      gifts: {
        ...state.gifts,
        pendingGiftId: null,
        pendingGiftInstanceId: null,
        isOpened: false,
        storage: [
          ...state.gifts.storage,
          { giftInstanceId, giftId: state.gifts.pendingGiftId, storedAt: new Date().toISOString() },
        ],
      },
    });
  },

  retrieveGift: (giftInstanceId) => {
    const state = get().state;
    persistAndSet(set, {
      ...state,
      gifts: {
        ...state.gifts,
        storage: state.gifts.storage.filter((entry) => entry.giftInstanceId !== giftInstanceId),
      },
    });
  },
}));

export const dressingBoothSelectors = { INITIAL_BOOTH_STATE };
