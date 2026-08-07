import type { RoomEntity } from '@/types/entities';
import type { EditableHouseState, FurnitureSaveState, PetSaveState, Vector2 } from '@/types/save';

/**
 * "Reset Room": restores furniture to the room's designer-defined default
 * layout, discarding the player's custom arrangement. Callers are expected
 * to confirm with the player first (destructive to their custom design).
 */
export function resetFurnitureToDefault(
  house: EditableHouseState,
  room: RoomEntity,
): EditableHouseState {
  const furniture: FurnitureSaveState[] = room.defaultLayout
    .filter((item) => item.itemType === 'furniture')
    .map((item) => ({
      instanceId: `${item.itemId}__default`,
      furnitureId: item.itemId,
      buildingId: house.buildingId,
      roomId: room.id,
      position: { x: item.x, y: item.y },
      rotation: item.rotation ?? 0,
    }));

  return { ...house, furniture, hasCustomLayout: false };
}

/**
 * "Tidy Up": a light, non-destructive cleanup - just nudges pets back to
 * their usual spot. Never touches the player's saved furniture layout.
 */
export function tidyPetsToDefault(
  pets: Record<string, PetSaveState>,
  defaultPositions: Record<string, Vector2>,
): Record<string, PetSaveState> {
  const next: Record<string, PetSaveState> = {};
  for (const [id, pet] of Object.entries(pets)) {
    const defaultPos = defaultPositions[id];
    next[id] = defaultPos ? { ...pet, position: defaultPos, carriedByCharacterId: null } : pet;
  }
  return next;
}
