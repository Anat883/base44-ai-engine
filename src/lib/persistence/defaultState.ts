import { CURRENT_SAVE_VERSION, type GameState } from '@/types/save';
import { CHARACTERS, ROOMS } from '@/data';
import { SHOP_BUILDING_ID, SHOP_CHARACTER_POSITIONS } from '@/features/wardrobe/shopDefaults';

const HOME_BUILDING_ID = 'home_house_01';
const HOME_ROOM_ID = 'house_living_room_01';

/**
 * Which starter characters begin visibly placed in the house, and where.
 * y-values sit on the illustrated living-room background's floor line
 * (~y=590 on the 1280x800 canvas), shifted +240 from the old placeholder
 * floor split. x-values are spaced ~300px apart so the now-larger
 * (CharacterView SCALE = 1.7) dolls, at ~210px wide, don't overlap.
 */
const HOUSE_CHARACTER_POSITIONS: Record<string, { x: number; y: number }> = {
  grandmother_01: { x: 150, y: 670 },
  small_child_01: { x: 450, y: 620 },
  mother_01: { x: 750, y: 600 },
  baby_01: { x: 1050, y: 660 },
};

export function createDefaultGameState(playerId: string): GameState {
  const now = new Date().toISOString();

  const characters: GameState['characters'] = {};
  for (const character of CHARACTERS) {
    const housePosition = HOUSE_CHARACTER_POSITIONS[character.id];
    const shopPosition = SHOP_CHARACTER_POSITIONS[character.id];
    const buildingId = housePosition ? HOME_BUILDING_ID : shopPosition ? SHOP_BUILDING_ID : '';
    const position = housePosition ?? shopPosition ?? { x: 0, y: 0 };
    characters[character.id] = {
      characterId: character.id,
      buildingId,
      position,
      outfitState: {
        outfitId: character.defaultOutfitId,
        hairId: character.defaultHairId,
        hairColor: '',
        glassesId: null,
        earringsId: null,
        hairAccessoryId: null,
        faceAccessoryId: null,
        heldItemId: null,
      },
    };
  }

  const room = ROOMS.find((r) => r.id === HOME_ROOM_ID);
  const furnitureLayout = room?.defaultLayout.filter((item) => item.itemType === 'furniture') ?? [];

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    playerId,
    characters,
    pets: {
      dog_01: {
        petId: 'dog_01',
        buildingId: HOME_BUILDING_ID,
        position: { x: 130, y: 745 },
        carriedByCharacterId: null,
      },
      cat_01: {
        petId: 'cat_01',
        buildingId: HOME_BUILDING_ID,
        position: { x: 1000, y: 715 },
        carriedByCharacterId: null,
      },
    },
    editableHouse: {
      buildingId: HOME_BUILDING_ID,
      furniture: furnitureLayout.map((item) => ({
        instanceId: `${item.itemId}__default`,
        furnitureId: item.itemId,
        buildingId: HOME_BUILDING_ID,
        roomId: HOME_ROOM_ID,
        position: { x: item.x, y: item.y },
        rotation: item.rotation ?? 0,
      })),
      hasCustomLayout: false,
    },
    shop: {
      dressingBoothCharacterId: null,
      dressingBoothState: 'EMPTY',
      dressingBoothSelectedOutfitId: null,
    },
    gifts: {
      lastGiftDate: null,
      pendingGiftId: null,
      pendingGiftInstanceId: null,
      isOpened: false,
      storage: [],
    },
    unlockedContent: [],
    updatedAt: now,
  };
}
