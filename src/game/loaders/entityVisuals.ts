import type {
  AccessoryEntity,
  BuildingEntity,
  FurnitureEntity,
  GiftEntity,
  HairEntity,
  HoldableItemEntity,
  OutfitEntity,
  PetEntity,
} from '@/types/entities';
import { SHAPE } from './shapeTextures';

const HAIR_COLOR_HEX: Record<HairEntity['color'], string> = {
  rainbow: '#B98CFF',
  pink: '#FF8FD1',
  purple: '#B98CFF',
  blue: '#4DB8FF',
  brown: '#8A5A3B',
  blonde: '#F2D06B',
  black: '#3A2E4D',
  gray: '#D9D9E0',
};

export function outfitVisual(outfit: OutfitEntity): {
  texture: string;
  color: string;
  trimColor?: string;
} {
  const dressLike: OutfitEntity['category'][] = ['dress', 'formalDress', 'formalWear', 'festive'];
  const texture = dressLike.includes(outfit.category) ? SHAPE.outfitDress : SHAPE.outfitShirt;
  return { texture, color: outfit.primaryColor, trimColor: outfit.secondaryColor };
}

export function hairVisual(hair: HairEntity): { texture: string; color: string; rainbow: boolean } {
  return {
    texture: hair.length === 'long' ? SHAPE.hairLong : SHAPE.hairShort,
    color: HAIR_COLOR_HEX[hair.color],
    rainbow: hair.color === 'rainbow',
  };
}

export function accessoryVisual(accessory: AccessoryEntity): { texture: string; color: string } {
  if (accessory.slot === 'glasses') {
    const texture = accessory.tags.includes('sun') ? SHAPE.sunglasses : SHAPE.glasses;
    return { texture, color: accessory.primaryColor };
  }
  if (accessory.slot === 'earrings') {
    return { texture: SHAPE.earring, color: accessory.primaryColor };
  }
  if (accessory.slot === 'hairAccessory') {
    const texture = accessory.tags.includes('crown') ? SHAPE.crown : SHAPE.hairBow;
    return { texture, color: accessory.primaryColor };
  }
  return { texture: SHAPE.glasses, color: accessory.primaryColor };
}

export function heldItemVisual(item: HoldableItemEntity): { texture: string; color: string } {
  if (item.category === 'bag') return { texture: SHAPE.bag, color: item.primaryColor };
  if (item.category === 'gadget') return { texture: SHAPE.rectItem, color: item.primaryColor };
  return { texture: SHAPE.star, color: item.primaryColor };
}

export function petVisual(pet: PetEntity): { earTexture: string } {
  return { earTexture: pet.species === 'cat' ? SHAPE.petEarPointy : SHAPE.petEarRound };
}

export function furnitureVisual(furniture: FurnitureEntity): { texture: string } {
  if (furniture.category === 'seating' && furniture.id.startsWith('chair')) {
    return { texture: SHAPE.chair };
  }
  if (furniture.category === 'table') return { texture: SHAPE.roundTable };
  return { texture: SHAPE.softRect };
}

export function buildingVisual(building: BuildingEntity): { texture: string } {
  if (building.unlockState === 'locked') return { texture: SHAPE.lockedBuilding };
  if (building.id.includes('shop')) return { texture: SHAPE.shopBuilding };
  if (building.id.includes('gift')) return { texture: SHAPE.giftBuilding };
  return { texture: SHAPE.houseBuilding };
}

export function giftVisual(gift: GiftEntity): { texture: string; color: string } {
  return { texture: SHAPE.giftBox, color: gift.wrapColor };
}
