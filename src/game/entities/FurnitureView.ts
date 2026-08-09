import Phaser from 'phaser';
import type { FurnitureEntity } from '@/types/entities';
import { furnitureVisual } from '@/game/loaders/entityVisuals';
import { colorToNumber } from '@/lib/color';

export class FurnitureView extends Phaser.GameObjects.Container {
  readonly instanceId: string;
  readonly furnitureId: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    furniture: FurnitureEntity,
    instanceId: string,
  ) {
    super(scene, x, y);
    this.instanceId = instanceId;
    this.furnitureId = furniture.id;

    const visual = furnitureVisual(furniture);
    const shape = scene.add
      .image(0, 0, visual.texture)
      .setTint(colorToNumber(furniture.primaryColor));
    shape.setDisplaySize(furniture.footprint.width, furniture.footprint.height);

    this.add(shape);
    this.setSize(furniture.footprint.width, furniture.footprint.height);
    scene.add.existing(this);
  }
}
