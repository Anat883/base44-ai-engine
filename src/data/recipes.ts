import type { RecipeEntity } from '@/types/entities';
import { SEED_CREATED_AT } from './seedTimestamp';

function recipe(partial: Omit<RecipeEntity, 'type' | 'createdAt'>): RecipeEntity {
  return { type: 'recipe', createdAt: SEED_CREATED_AT, ...partial };
}

/**
 * Demo-only recipe proving the data model. The cooking station reads this
 * list and matches ingredientIds -> resultItemId; adding new recipes never
 * requires touching cooking system code.
 */
export const RECIPES: RecipeEntity[] = [
  recipe({
    id: 'recipe_cupcake_01',
    name: 'Bake a Cupcake',
    assetKey: 'recipe_cupcake',
    thumbnail: 'food_cupcake',
    tags: ['baking', 'demo'],
    category: 'recipe',
    zIndex: 0,
    interactionTypes: [],
    isDefault: true,
    isCollectible: false,
    isMovable: false,
    ingredientIds: ['ingredient_flour_01', 'ingredient_egg_01'],
    resultItemId: 'food_cupcake_01',
    stationType: 'kitchenCounter',
    animationKey: 'cook_sparkle',
  }),
];
