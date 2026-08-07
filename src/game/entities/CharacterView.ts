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
      .image(0, -6, SHAPE.bodyCapsule)
      .setTint(colorToNumber(character.skinTone));
    this.head = scene.add
      .image(0, -52, SHAPE.headCircle)
      .setTint(colorToNumber(character.skinTone));
    this.outfit = scene.add.image(0, 0, SHAPE.outfitShirt);
    this.trim = scene.add.image(0, 26, SHAPE.outfitTrim);
    this.hair = scene.add.image(0, -58, SHAPE.hairShort);
    this.sparkles = SPARKLE_ACCENTS.map((color, i) =>
      scene.add
        .image(-14 + i * 14, -78, SHAPE.sparkle)
        .setTint(colorToNumber(color))
        .setVisible(false),
    );
    this.glasses = scene.add.image(0, -50, SHAPE.glasses).setVisible(false);
    this.earringL = scene.add.image(-18, -44, SHAPE.earring).setVisible(false);
    this.earringR = scene.add.image(18, -44, SHAPE.earring).setVisible(false).setFlipX(true);
    this.hairAccessory = scene.add.image(14, -76, SHAPE.hairBow).setVisible(false);
    this.heldItem = scene.add.image(30, -6, SHAPE.bag).setVisible(false);

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
      const visual = outfitVisual(outfit);
      this.outfit.setTexture(visual.texture).setTint(colorToNumber(visual.color));
      this.outfit.setY(outfit.category === 'formalDress' || outfit.category === 'dress' ? 8 : 0);
      if (visual.trimColor) {
        this.trim.setVisible(true).setTint(colorToNumber(visual.trimColor));
      } else {
        this.trim.setVisible(false);
      }
    }

    const hair = hairById.get(outfitState.hairId);
    if (hair) {
      const visual = hairVisual(hair);
      this.hair.setTexture(visual.texture).setTint(colorToNumber(visual.color));
      this.hair.setY(hair.length === 'long' ? -50 : -58);
      this.sparkles.forEach((sparkle) => sparkle.setVisible(visual.rainbow));
    }

    this.applyAccessory(this.glasses, outfitState.glassesId, [-50]);
    this.applyEarrings(outfitState.earringsId);
    this.applyAccessory(this.hairAccessory, outfitState.hairAccessoryId, [-76]);
    this.applyHeldItem(outfitState.heldItemId);
  }

  private applyAccessory(
    target: Phaser.GameObjects.Image,
    id: string | null,
    _pos: number[],
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
    this.earringR.setTexture(visual.texture).setTint(color).setVisible(true);
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
