/**
 * Shared, data-driven content model. Every piece of game content (outfits, hair,
 * furniture, gifts, ...) is a plain data record with a stable `id` rather than
 * something hard-coded into a UI component. New content ships as new records +
 * assets, not new game logic.
 */

export type EntityType =
  | 'character'
  | 'outfit'
  | 'hair'
  | 'accessory'
  | 'pet'
  | 'furniture'
  | 'holdableItem'
  | 'food'
  | 'ingredient'
  | 'gift'
  | 'building'
  | 'room'
  | 'shopItem'
  | 'recipe';

export interface BaseEntity {
  id: string;
  type: EntityType;
  name: string;
  /** Key used to look up / generate the placeholder art texture for this item. */
  assetKey: string;
  /** Key used for small grid thumbnails in wardrobe/shop/admin UIs. */
  thumbnail: string;
  tags: string[];
  category: string;
  zIndex: number;
  interactionTypes: InteractionType[];
  isDefault: boolean;
  isCollectible: boolean;
  isMovable: boolean;
  createdAt: string;
}

export type InteractionType =
  'drag' | 'wear' | 'hold' | 'sit' | 'enter' | 'open' | 'tidy' | 'store';

export type CharacterArchetype =
  'baby' | 'small_child' | 'child' | 'mother' | 'father' | 'grandmother' | 'grandfather';

export interface CharacterEntity extends BaseEntity {
  type: 'character';
  archetype: CharacterArchetype;
  skinTone: string;
  defaultOutfitId: string;
  defaultHairId: string;
  canHoldItems: boolean;
  canCarryPet: boolean;
}

export type OutfitCategory =
  | 'dress'
  | 'formalDress'
  | 'shirt'
  | 'pants'
  | 'sweater'
  | 'shoes'
  | 'formalWear'
  | 'childrensWear'
  | 'grandmotherStyle'
  | 'festive';

export interface OutfitEntity extends BaseEntity {
  type: 'outfit';
  category: OutfitCategory;
  primaryColor: string;
  secondaryColor?: string;
  fitsArchetypes: CharacterArchetype[];
}

export type HairColor = 'rainbow' | 'pink' | 'purple' | 'blue' | 'brown' | 'blonde' | 'black';

export interface HairEntity extends BaseEntity {
  type: 'hair';
  length: 'short' | 'long';
  color: HairColor;
}

export type AccessorySlot = 'glasses' | 'earrings' | 'hairAccessory' | 'faceAccessory' | 'bag';

export interface AccessoryEntity extends BaseEntity {
  type: 'accessory';
  slot: AccessorySlot;
  primaryColor: string;
}

export interface PetEntity extends BaseEntity {
  type: 'pet';
  species: 'dog' | 'cat';
  primaryColor: string;
  canBeCarried: boolean;
}

export type FurnitureCategory = 'seating' | 'table' | 'storage' | 'decor';

export interface FurnitureEntity extends BaseEntity {
  type: 'furniture';
  category: FurnitureCategory;
  primaryColor: string;
  footprint: { width: number; height: number };
}

export interface HoldableItemEntity extends BaseEntity {
  type: 'holdableItem';
  primaryColor: string;
}

export interface IngredientEntity extends BaseEntity {
  type: 'ingredient';
  primaryColor: string;
}

export interface FoodEntity extends BaseEntity {
  type: 'food';
  primaryColor: string;
}

export type GiftPoolWeight = number;

export interface GiftEntity extends BaseEntity {
  type: 'gift';
  contentsItemId: string;
  contentsItemType: 'holdableItem' | 'outfit' | 'accessory' | 'furniture';
  poolWeight: GiftPoolWeight;
  wrapColor: string;
}

export type BuildingKind = 'fixed' | 'customizable';

export interface BuildingEntity extends BaseEntity {
  type: 'building';
  kind: BuildingKind;
  sceneAsset: string;
  rooms: string[];
  editable: boolean;
  entryPosition: { x: number; y: number };
  unlockState: 'unlocked' | 'locked';
  mapPosition: { x: number; y: number };
  palette: string[];
}

export interface RoomEntity extends BaseEntity {
  type: 'room';
  buildingId: string;
  defaultLayout: PlacedItem[];
}

export interface PlacedItem {
  itemId: string;
  itemType: 'furniture' | 'holdableItem' | 'pet';
  x: number;
  y: number;
  rotation?: number;
}

export interface ShopItemEntity extends BaseEntity {
  type: 'shopItem';
  refItemId: string;
  refItemType: 'outfit' | 'hair' | 'accessory' | 'holdableItem';
  rackPosition: { x: number; y: number };
}

export type CookingStationType = 'kitchenCounter' | 'stove' | 'oven';

export interface RecipeEntity extends BaseEntity {
  type: 'recipe';
  ingredientIds: string[];
  resultItemId: string;
  stationType: CookingStationType;
  animationKey: string;
}

export type AnyContentEntity =
  | CharacterEntity
  | OutfitEntity
  | HairEntity
  | AccessoryEntity
  | PetEntity
  | FurnitureEntity
  | HoldableItemEntity
  | IngredientEntity
  | FoodEntity
  | GiftEntity
  | BuildingEntity
  | RoomEntity
  | ShopItemEntity
  | RecipeEntity;
