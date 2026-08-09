import type { FurnitureEntity } from '@/types/entities';
import { SEED_CREATED_AT } from './seedTimestamp';

function furniture(partial: Omit<FurnitureEntity, 'type' | 'createdAt'>): FurnitureEntity {
  return { type: 'furniture', createdAt: SEED_CREATED_AT, ...partial };
}

const CHAIRS: [id: string, name: string, color: string][] = [
  ['chair_red_01', 'Red Chair', '#FF5C7A'],
  ['chair_orange_01', 'Orange Chair', '#FF9A4D'],
  ['chair_yellow_01', 'Yellow Chair', '#FFD34D'],
  ['chair_green_01', 'Green Chair', '#5BD98A'],
  ['chair_blue_01', 'Blue Chair', '#4DB8FF'],
  ['chair_pink_01', 'Pink Chair', '#FF8FD1'],
  ['chair_purple_01', 'Purple Chair', '#B98CFF'],
];

const chairEntities: FurnitureEntity[] = CHAIRS.map(([id, name, color]) =>
  furniture({
    id,
    name,
    category: 'seating',
    assetKey: 'furn_chair',
    thumbnail: 'furn_chair',
    tags: ['chair', 'seating'],
    zIndex: 5,
    interactionTypes: ['drag', 'sit'],
    isDefault: id === 'chair_blue_01',
    isCollectible: false,
    isMovable: true,
    primaryColor: color,
    // Matches chair.png's own aspect ratio (752x724) at a size that reads
    // against the illustrated room backgrounds instead of a tiny icon.
    footprint: { width: 110, height: 106 },
  }),
);

export const FURNITURE: FurnitureEntity[] = [
  furniture({
    id: 'sofa_01',
    name: 'Comfy Sofa',
    category: 'seating',
    assetKey: 'furn_sofa',
    thumbnail: 'furn_sofa',
    tags: ['living-room', 'seating'],
    zIndex: 5,
    interactionTypes: ['drag', 'sit'],
    isDefault: true,
    isCollectible: false,
    isMovable: true,
    primaryColor: '#FF8FD1',
    // Matches sofa.png's own aspect ratio (960x576).
    footprint: { width: 260, height: 156 },
  }),
  furniture({
    id: 'table_01',
    name: 'Round Table',
    category: 'table',
    assetKey: 'furn_table',
    thumbnail: 'furn_table',
    tags: ['living-room', 'table'],
    zIndex: 5,
    interactionTypes: ['drag'],
    isDefault: true,
    isCollectible: false,
    isMovable: true,
    primaryColor: '#FFD34D',
    // Matches table.png's own aspect ratio (760x646).
    footprint: { width: 150, height: 127 },
  }),
  ...chairEntities,
];
