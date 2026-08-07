import type { AnyContentEntity } from '@/types/entities';
import { CHARACTERS } from './characters';
import { OUTFITS } from './outfits';
import { HAIR } from './hair';
import { ACCESSORIES } from './accessories';
import { PETS } from './pets';
import { FURNITURE } from './furniture';
import { HOLDABLE_ITEMS } from './holdables';
import { INGREDIENTS, FOOD } from './food';
import { GIFTS } from './gifts';
import { BUILDINGS, ROOMS } from './buildings';
import { RECIPES } from './recipes';

export {
  CHARACTERS,
  OUTFITS,
  HAIR,
  ACCESSORIES,
  PETS,
  FURNITURE,
  HOLDABLE_ITEMS,
  INGREDIENTS,
  FOOD,
  GIFTS,
  BUILDINGS,
  ROOMS,
  RECIPES,
};

/** Everything in one flat list, e.g. for the dev Content Catalog. */
export const ALL_CONTENT: AnyContentEntity[] = [
  ...CHARACTERS,
  ...OUTFITS,
  ...HAIR,
  ...ACCESSORIES,
  ...PETS,
  ...FURNITURE,
  ...HOLDABLE_ITEMS,
  ...INGREDIENTS,
  ...FOOD,
  ...GIFTS,
  ...BUILDINGS,
  ...ROOMS,
  ...RECIPES,
];

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export const charactersById = indexById(CHARACTERS);
export const outfitsById = indexById(OUTFITS);
export const hairById = indexById(HAIR);
export const accessoriesById = indexById(ACCESSORIES);
export const petsById = indexById(PETS);
export const furnitureById = indexById(FURNITURE);
export const holdableItemsById = indexById(HOLDABLE_ITEMS);
export const ingredientsById = indexById(INGREDIENTS);
export const foodById = indexById(FOOD);
export const giftsById = indexById(GIFTS);
export const buildingsById = indexById(BUILDINGS);
export const roomsById = indexById(ROOMS);
export const recipesById = indexById(RECIPES);
