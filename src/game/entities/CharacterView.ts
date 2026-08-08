import Phaser from 'phaser';
import type { CharacterEntity } from '@/types/entities';
import type { CharacterOutfitState } from '@/types/save';
import { accessoriesById, hairById, holdableItemsById, outfitsById } from '@/data';
import { SHAPE } from '@/game/loaders/shapeTextures';
import {
  accessoryVisual,
  hairVisual,
  heldItemVisual,
  outfitVisual,
} from '@/game/loaders/entityVisuals';
import { colorToNumber } from '@/lib/color';

const SPARKLE_ACCENTS = ['#FF5C7A', '#FFD34D', '#4DB8FF'];

/** Target on-screen sizes for the illustrated shape layers (uniform scale, aspect preserved). */
const LAYER_SIZE = {
  head: 60,
  body: 108, // full standing figure (torso+arms+legs); this one is a target HEIGHT, not width
  outfitShirt: 90,
  outfitDress: 92,
  outfitTrim: 50,
  hairShort: 66,
  // hair-long stays on the procedural shape (see shapeImages.ts), whose
  // canvas proportions differ from the illustrated layers above, so this
  // is tuned against that shape rather than hair-long.png.
  hairLong: 66,
  glasses: 40,
  earring: 12,
  hairBow: 32,
};

const BODY_Y = -6;
const HEAD_Y = -85;
const OUTFIT_SHIRT_Y = -34;
const OUTFIT_DRESS_Y = -20;
const TRIM_Y = -8;
const HAIR_SHORT_Y = HEAD_Y - 6;
const HAIR_LONG_Y = HEAD_Y + 9; // top-aligned with hair-short's crown; the procedural shape is taller, so it drapes further down from there
const GLASSES_Y = HEAD_Y + 2;
const EARRING_Y = HEAD_Y + 8;
const EARRING_X = 22;
const HAIR_ACCESSORY_Y = HEAD_Y - 24;
const HAIR_ACCESSORY_X = 12;
const HELD_ITEM_X = 60;

/** Uniformly scales `image` so its display width matches `targetWidth`, preserving aspect ratio. */
function fitWidth(image: Phaser.GameObjects.Image, targetWidth: number): void {
  const scale = targetWidth / image.width;
  image.setScale(scale);
}

/** Uniformly scales `image` so its display height matches `targetHeight`, preserving aspect ratio. */
function fitHeight(image: Phaser.GameObjects.Image, targetHeight: number): void {
  const scale = targetHeight / image.height;
  image.setScale(scale);
}

/**
 * A character rendered as layered, independently-tinted shape sprites
 * (skin, outfit, hair, accessories, held item) inside one Container. Layers
 * are swapped/tinted in place on `applyOutfitState`, so changing an outfit
 * never rebuilds the whole character.
 */
export class CharacterView extends Phaser.GameObjects.Container {
  readonly characterId: string;
  private bodyShape: Phaser.GameObjects.Image;
  private head: Phaser.GameObjects.Image;
  private outfit: Phaser.GameObjects.Image;
  private trim: Phaser.GameObjects.Image;
  private hair: Phaser.GameObjects.Image;
  private sparkles: Phaser.GameObjects.Image[];
  private glasses: Phaser.GameObjects.Image;
  private earringL: Phaser.GameObjects.Image;
  private earringR: Phaser.GameObjects.Image;
  private hairAccessory: Phaser.GameObjects.Image;
  private heldItem: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, character: CharacterEntity) {
    super(scene, x, y);
    this.characterId = character.id;

    this.bodyShape = scene.add
      .image(0, BODY_Y, SHAPE.bodyCapsule)
      .setTint(colorToNumber(character.skinTone));
    fitHeight(this.bodyShape, LAYER_SIZE.body);
    this.head = scene.add
      .image(0, HEAD_Y, SHAPE.headCircle)
      .setTint(colorToNumber(character.skinTone));
    fitWidth(this.head, LAYER_SIZE.head);
    this.outfit = scene.add.image(0, OUTFIT_SHIRT_Y, SHAPE.outfitShirt);
    fitWidth(this.outfit, LAYER_SIZE.outfitShirt);
    this.trim = scene.add.image(0, TRIM_Y, SHAPE.outfitTrim);
    fitWidth(this.trim, LAYER_SIZE.outfitTrim);
    this.hair = scene.add.image(0, HAIR_SHORT_Y, SHAPE.hairShort);
    fitWidth(this.hair, LAYER_SIZE.hairShort);
    this.sparkles = SPARKLE_ACCENTS.map((color, i) =>
      scene.add
        .image(-14 + i * 14, HEAD_Y - 26, SHAPE.sparkle)
        .setTint(colorToNumber(color))
        .setVisible(false),
    );
    this.glasses = scene.add.image(0, GLASSES_Y, SHAPE.glasses).setVisible(false);
    fitWidth(this.glasses, LAYER_SIZE.glasses);
    this.earringL = scene.add.image(-EARRING_X, EARRING_Y, SHAPE.earring).setVisible(false);
    fitWidth(this.earringL, LAYER_SIZE.earring);
    this.earringR = scene.add
      .image(EARRING_X, EARRING_Y, SHAPE.earring)
      .setVisible(false)
      .setFlipX(true);
    fitWidth(this.earringR, LAYER_SIZE.earring);
    this.hairAccessory = scene.add
      .image(HAIR_ACCESSORY_X, HAIR_ACCESSORY_Y, SHAPE.hairBow)
      .setVisible(false);
    fitWidth(this.hairAccessory, LAYER_SIZE.hairBow);
    this.heldItem = scene.add.image(HELD_ITEM_X, BODY_Y, SHAPE.bag).setVisible(false);

    this.add([
      this.bodyShape,
      this.outfit,
      this.trim,
      this.head,
      this.hair,
      ...this.sparkles,
      this.glasses,
      this.earringL,
      this.earringR,
      this.hairAccessory,
      this.heldItem,
    ]);

    this.setSize(90, 150);
    scene.add.existing(this);
  }

  applyOutfitState(outfitState: CharacterOutfitState): void {
    const outfit = outfitsById.get(outfitState.outfitId);
    if (outfit) {
      const isDress = outfit.category === 'formalDress' || outfit.category === 'dress';
      const visual = outfitVisual(outfit);
      this.outfit.setTexture(visual.texture).setTint(colorToNumber(visual.color));
      fitWidth(this.outfit, isDress ? LAYER_SIZE.outfitDress : LAYER_SIZE.outfitShirt);
      this.outfit.setY(isDress ? OUTFIT_DRESS_Y : OUTFIT_SHIRT_Y);
      if (visual.trimColor) {
        this.trim.setVisible(true).setTint(colorToNumber(visual.trimColor));
      } else {
        this.trim.setVisible(false);
      }
    }

    const hair = hairById.get(outfitState.hairId);
    if (hair) {
      const isLong = hair.length === 'long';
      const visual = hairVisual(hair);
      this.hair.setTexture(visual.texture).setTint(colorToNumber(visual.color));
      fitWidth(this.hair, isLong ? LAYER_SIZE.hairLong : LAYER_SIZE.hairShort);
      this.hair.setY(isLong ? HAIR_LONG_Y : HAIR_SHORT_Y);
      this.sparkles.forEach((sparkle) => sparkle.setVisible(visual.rainbow));
    }

    this.applyAccessory(this.glasses, outfitState.glassesId, LAYER_SIZE.glasses);
    this.applyEarrings(outfitState.earringsId);
    this.applyAccessory(this.hairAccessory, outfitState.hairAccessoryId, LAYER_SIZE.hairBow);
    this.applyHeldItem(outfitState.heldItemId);
  }

  private applyAccessory(
    target: Phaser.GameObjects.Image,
    id: string | null,
    targetWidth: number,
  ): void {
    if (!id) {
      target.setVisible(false);
      return;
    }
    const accessory = accessoriesById.get(id);
    if (!accessory) {
      target.setVisible(false);
      return;
    }
    const visual = accessoryVisual(accessory);
    target.setTexture(visual.texture).setTint(colorToNumber(visual.color)).setVisible(true);
    fitWidth(target, targetWidth);
  }

  private applyEarrings(id: string | null): void {
    if (!id || !accessoriesById.get(id)) {
      this.earringL.setVisible(false);
      this.earringR.setVisible(false);
      return;
    }
    const accessory = accessoriesById.get(id)!;
    const visual = accessoryVisual(accessory);
    const color = colorToNumber(visual.color);
    this.earringL.setTexture(visual.texture).setTint(color).setVisible(true);
    fitWidth(this.earringL, LAYER_SIZE.earring);
    this.earringR.setTexture(visual.texture).setTint(color).setVisible(true);
    fitWidth(this.earringR, LAYER_SIZE.earring);
  }

  private applyHeldItem(id: string | null): void {
    if (!id) {
      this.heldItem.setVisible(false);
      return;
    }
    const item = holdableItemsById.get(id);
    if (!item) {
      this.heldItem.setVisible(false);
      return;
    }
    const visual = heldItemVisual(item);
    this.heldItem.setTexture(visual.texture).setTint(colorToNumber(visual.color)).setVisible(true);
  }
}
