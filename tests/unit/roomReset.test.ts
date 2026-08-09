import { describe, expect, it } from 'vitest';
import { resetFurnitureToDefault, tidyPetsToDefault } from '@/features/furniture/roomReset';
import { ROOMS } from '@/data';
import type { EditableHouseState, PetSaveState } from '@/types/save';

const room = ROOMS.find((r) => r.id === 'house_living_room_01')!;

describe('tidy/reset behavior', () => {
  it('resetFurnitureToDefault discards a custom layout and restores the designer defaults', () => {
    const customized: EditableHouseState = {
      buildingId: room.buildingId,
      hasCustomLayout: true,
      furniture: [
        {
          instanceId: 'sofa_01__default',
          furnitureId: 'sofa_01',
          buildingId: room.buildingId,
          roomId: room.id,
          position: { x: 999, y: 999 },
          rotation: 0,
        },
      ],
    };

    const reset = resetFurnitureToDefault(customized, room);

    expect(reset.hasCustomLayout).toBe(false);
    const sofa = reset.furniture.find((f) => f.furnitureId === 'sofa_01');
    const defaultSofa = room.defaultLayout.find((i) => i.itemId === 'sofa_01')!;
    expect(sofa?.position).toEqual({ x: defaultSofa.x, y: defaultSofa.y });
  });

  it('resetFurnitureToDefault reproduces every furniture item from the room definition', () => {
    const empty: EditableHouseState = {
      buildingId: room.buildingId,
      hasCustomLayout: true,
      furniture: [],
    };
    const reset = resetFurnitureToDefault(empty, room);
    const expectedCount = room.defaultLayout.filter((i) => i.itemType === 'furniture').length;
    expect(reset.furniture).toHaveLength(expectedCount);
  });

  it('tidyPetsToDefault (Tidy Up) only touches pets, never furniture state', () => {
    const pets: Record<string, PetSaveState> = {
      dog_01: {
        petId: 'dog_01',
        buildingId: room.buildingId,
        position: { x: 5, y: 5 },
        carriedByCharacterId: 'child_01',
      },
    };
    const tidied = tidyPetsToDefault(pets, { dog_01: { x: 200, y: 520 } });
    expect(tidied.dog_01.position).toEqual({ x: 200, y: 520 });
    expect(tidied.dog_01.carriedByCharacterId).toBeNull();
  });

  it('tidyPetsToDefault leaves pets with no configured default position untouched', () => {
    const pets: Record<string, PetSaveState> = {
      mystery_pet: {
        petId: 'mystery_pet',
        buildingId: room.buildingId,
        position: { x: 5, y: 5 },
        carriedByCharacterId: null,
      },
    };
    const tidied = tidyPetsToDefault(pets, {});
    expect(tidied.mystery_pet.position).toEqual({ x: 5, y: 5 });
  });
});
