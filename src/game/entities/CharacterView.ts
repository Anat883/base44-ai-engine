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
 * Fixed on-screen box for each layer, in container-local coordinates.
 * The illustrated PNGs are cropped tight to their own content and come in
 * at wildly different native resolutions, so every layer is force-sized to
 * its box via `setDisplaySize` (instead of relying on native texture size)
 * and centered on these anchor points, which were measured against the art
 * so the neckline/crown/face-hole landmarks line up across layers.
 */
const LAYER_BOX = {
  body: { width: 60, height: 90, x: 0, y: -10 },
  outfitDress: { width: 60, height: 90, x: 0, y: -10 },
  outfitShirt: { width: 71, height: 54, x: 0, y: -28 },
  trim: { width: 45, height: 9, x: 0, y: 3 },
  head: { width: 56, height: 50, x: 0, y: -75 },
  hairShort: { width: 61, height: 50, x: 0, y: -75 },
  // hair-long stays on the procedural shape (see characterArt.ts), whose
  // canvas aspect differs from the illustrated layers above.
  hairLong: { width: 63, height: 81, x: 0, y: -60 },
  glasses: { width: 40, height: 19, x: 0, y: -75 },
  earring: { width: 10, height: 12, x: 24, y: -70 },
  hairAccessory: { width: 28, height: 18, x: 16, y: -85 },
} as const;

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
      .image(LAYER_BOX.body.x, LAYER_BOX.body.y, SHAPE.bodyCapsule)
      .setDisplaySize(LAYER_BOX.body.width, LAYER_BOX.body.height)
      .setTint(colorToNumber(character.skinTone));
    this.head = scene.add
      .image(LAYER_BOX.head.x, LAYER_BOX.head.y, SHAPE.headCircle)
      .setDisplaySize(LAYER_BOX.head.width, LAYER_BOX.head.height)
      .setTint(colorToNumber(character.skinTone));
    this.outfit = scene.add.image(LAYER_BOX.outfitShirt.x, LAYER_BOX.outfitShirt.y, SHAPE.outfitShirt);
    this.trim = scene.add
      .image(LAYER_BOX.trim.x, LAYER_BOX.trim.y, SHAPE.outfitTrim)
      .setDisplaySize(LAYER_BOX.trim.width, LAYER_BOX.trim.height);
    this.hair = scene.add.image(LAYER_BOX.hairShort.x, LAYER_BOX.hairShort.y, SHAPE.hairShort);
    this.sparkles = SPARKLE_ACCENTS.map((color, i) =>
      scene.add
        .image(-14 + i * 14, -98, SHAPE.sparkle)
        .setTint(colorToNumber(color))
        .setVisible(false),
    );
    this.glasses = scene.add
      .image(LAYER_BOX.glasses.x, LAYER_BOX.glasses.y, SHAPE.glasses)
      .setDisplaySize(LAYER_BOX.glasses.width, LAYER_BOX.glasses.height)
      .setVisible(false);
    this.earringL = scene.add
      .image(-LAYER_BOX.earring.x, LAYER_BOX.earring.y, SHAPE.earring)
      .setDisplaySize(LAYER_BOX.earring.width, LAYER_BOX.earring.height)
      .setVisible(false);
    this.earringR = scene.add
      .image(LAYER_BOX.earring.x, LAYER_BOX.earring.y, SHAPE.earring)
      .setDisplaySize(LAYER_BOX.earring.width, LAYER_BOX.earring.height)
      .setVisible(false)
      .setFlipX(true);
    this.hairAccessory = scene.add
      .image(LAYER_BOX.hairAccessory.x, LAYER_BOX.hairAccessory.y, SHAPE.hairBow)
      .setDisplaySize(LAYER_BOX.hairAccessory.width, LAYER_BOX.hairAccessory.height)
      .setVisible(false);
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
      const box = visual.texture === SHAPE.outfitDress ? LAYER_BOX.outfitDress : LAYER_BOX.outfitShirt;
      this.outfit
        .setTexture(visual.texture)
        .setDisplaySize(box.width, box.height)
        .setPosition(box.x, box.y)
        .setTint(colorToNumber(visual.color));
      if (visual.trimColor) {
        this.trim.setVisible(true).setTint(colorToNumber(visual.trimColor));
      } else {
        this.trim.setVisible(false);
      }
    }

    const hair = hairById.get(outfitState.hairId);
    if (hair) {
      const visual = hairVisual(hair);
      const box = visual.texture === SHAPE.hairLong ? LAYER_BOX.hairLong : LAYER_BOX.hairShort;
      this.hair
        .setTexture(visual.texture)
        .setDisplaySize(box.width, box.height)
        .setPosition(box.x, box.y)
        .setTint(colorToNumber(visual.color));
      this.sparkles.forEach((sparkle) => sparkle.setVisible(visual.rainbow));
    }

    this.applyAccessory(this.glasses, outfitState.glassesId, LAYER_BOX.glasses);
    this.applyEarrings(outfitState.earringsId);
    this.applyAccessory(this.hairAccessory, outfitState.hairAccessoryId, LAYER_BOX.hairAccessory);
    this.applyHeldItem(outfitState.heldItemId);
  }

  private applyAccessory(
    target: Phaser.GameObjects.Image,
    id: string | null,
    box: { width: number; height: number },
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
    target
      .setTexture(visual.texture)
      .setDisplaySize(box.width, box.height)
      .setTint(colorToNumber(visual.color))
      .setVisible(true);
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
    const { width, height } = LAYER_BOX.earring;
    this.earringL.setTexture(visual.texture).setDisplaySize(width, height).setTint(color).setVisible(true);
    this.earringR.setTexture(visual.texture).setDisplaySize(width, height).setTint(color).setVisible(true);
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
