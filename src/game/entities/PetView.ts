import Phaser from 'phaser';
import type { PetEntity } from '@/types/entities';
import { SHAPE } from '@/game/loaders/shapeTextures';
import { petVisual } from '@/game/loaders/entityVisuals';
import { colorToNumber } from '@/lib/color';

export class PetView extends Phaser.GameObjects.Container {
  readonly petId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, pet: PetEntity) {
    super(scene, x, y);
    this.petId = pet.id;

    const tint = colorToNumber(pet.primaryColor);
    const visual = petVisual(pet);
    const body = scene.add.image(0, 0, SHAPE.petBody).setTint(tint);
    const earL = scene.add.image(-8, -18, visual.earTexture).setTint(tint);
    const earR = scene.add.image(4, -20, visual.earTexture).setTint(tint);

    this.add([body, earL, earR]);
    this.setSize(84, 56);
    scene.add.existing(this);
  }
}
