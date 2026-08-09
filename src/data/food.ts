import type { FoodEntity, IngredientEntity } from '@/types/entities';
import { SEED_CREATED_AT } from './seedTimestamp';

function ingredient(partial: Omit<IngredientEntity, 'type' | 'createdAt'>): IngredientEntity {
  return { type: 'ingredient', createdAt: SEED_CREATED_AT, ...partial };
}

function food(partial: Omit<FoodEntity, 'type' | 'createdAt'>): FoodEntity {
  return { type: 'food', createdAt: SEED_CREATED_AT, ...partial };
}

export const INGREDIENTS: IngredientEntity[] = [
  ingredient({
    id: 'ingredient_flour_01',
    name: 'Flour',
    assetKey: 'ingredient_flour',
    thumbnail: 'ingredient_flour',
    tags: ['baking'],
    category: 'ingredient',
    zIndex: 5,
    interactionTypes: ['drag', 'hold'],
    isDefault: true,
    isCollectible: true,
    isMovable: true,
    primaryColor: '#FFFFFF',
  }),
  ingredient({
    id: 'ingredient_egg_01',
    name: 'Egg',
    assetKey: 'ingredient_egg',
    thumbnail: 'ingredient_egg',
    tags: ['baking'],
    category: 'ingredient',
    zIndex: 5,
    interactionTypes: ['drag', 'hold'],
    isDefault: true,
    isCollectible: true,
    isMovable: true,
    primaryColor: '#FFD34D',
  }),
];

export const FOOD: FoodEntity[] = [
  food({
    id: 'food_cupcake_01',
    name: 'Cupcake',
    assetKey: 'food_cupcake',
    thumbnail: 'food_cupcake',
    tags: ['dessert'],
    category: 'food',
    zIndex: 5,
    interactionTypes: ['drag', 'hold'],
    isDefault: false,
    isCollectible: true,
    isMovable: true,
    primaryColor: '#FF8FD1',
  }),
];
