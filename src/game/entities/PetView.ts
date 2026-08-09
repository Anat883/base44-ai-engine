import Phaser from 'phaser';
import type { PetEntity } from '@/types/entities';
import { SHAPE } from '@/game/loaders/shapeTextures';
import { petVisual } from '@/game/loaders/entityVisuals';
import { colorToNumber } from '@/lib/color';

// Illustrated pet-body.png/pet-ear-*.png come in at native resolutions much
// bigger than the old procedural canvases (which PetView used to render at
// 1:1 with no explicit sizing), so every layer needs an explicit target size.
const BODY_HEIGHT = 130;
const EAR_WIDTH = 38;
const EAR_L = { x: -24, y: -58 };
const EAR_R = { x: 20, y: -62 };
export const PET_HITBOX = { width: 110, height: 170 };

function fitHeight(image: Phaser.GameObjects.Image, targetHeight: number): void {
  image.setScale(targetHeight / image.height);
}

function fitWidth(image: Phaser.GameObjects.Image, targetWidth: number): void {
  image.setScale(targetWidth / image.width);
}

export class PetView extends Phaser.GameObjects.Container {
  readonly petId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, pet: PetEntity) {
    super(scene, x, y);
    this.petId = pet.id;

    const tint = colorToNumber(pet.primaryColor);
    const visual = petVisual(pet);
    const body = scene.add.image(0, 0, SHAPE.petBody).setTint(tint);
    fitHeight(body, BODY_HEIGHT);
    const earL = scene.add.image(EAR_L.x, EAR_L.y, visual.earTexture).setTint(tint);
    fitWidth(earL, EAR_WIDTH);
    const earR = scene.add.image(EAR_R.x, EAR_R.y, visual.earTexture).setTint(tint).setFlipX(true);
    fitWidth(earR, EAR_WIDTH);

    this.add([body, earL, earR]);
    this.setSize(PET_HITBOX.width, PET_HITBOX.height);
    scene.add.existing(this);
  }
}
