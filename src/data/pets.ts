import type { PetEntity } from '@/types/entities';
import { SEED_CREATED_AT } from './seedTimestamp';

function pet(partial: Omit<PetEntity, 'type' | 'createdAt'>): PetEntity {
  return { type: 'pet', createdAt: SEED_CREATED_AT, ...partial };
}

export const PETS: PetEntity[] = [
  pet({
    id: 'dog_01',
    name: 'Buddy',
    species: 'dog',
    assetKey: 'pet_dog',
    thumbnail: 'pet_dog',
    tags: ['dog', 'pet'],
    category: 'pet',
    zIndex: 15,
    interactionTypes: ['drag'],
    isDefault: true,
    isCollectible: false,
    isMovable: true,
    primaryColor: '#E8B27C',
    canBeCarried: true,
  }),
  pet({
    id: 'cat_01',
    name: 'Whiskers',
    species: 'cat',
    assetKey: 'pet_cat',
    thumbnail: 'pet_cat',
    tags: ['cat', 'pet'],
    category: 'pet',
    zIndex: 15,
    interactionTypes: ['drag'],
    isDefault: true,
    isCollectible: false,
    isMovable: true,
    primaryColor: '#B98CFF',
    canBeCarried: true,
  }),
];
