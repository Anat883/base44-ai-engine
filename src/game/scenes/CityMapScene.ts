import Phaser from 'phaser';
import { BUILDINGS } from '@/data';
import { ensureBaseShapeTextures } from '@/game/loaders/shapeTextures';
import { preloadCharacterArt } from '@/game/loaders/characterArt';
import { buildingVisual } from '@/game/loaders/entityVisuals';
import { colorToNumber } from '@/lib/color';
import { EventBus } from '@/game/EventBus';
import { gameController } from '@/game/gameController';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 800;

/** The Doll City home screen: a friendly map of clickable buildings. */
export class CityMapScene extends Phaser.Scene {
  constructor() {
    super('CityMap');
  }

  preload(): void {
    preloadCharacterArt(this);
  }

  create(): void {
    ensureBaseShapeTextures(this);
    this.cameras.main.setBackgroundColor('#CFF3E0');

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 90, GAME_WIDTH, 220, colorToNumber('#9FE3B8'))
      .setAlpha(0.6);

    this.add
      .text(GAME_WIDTH / 2, 56, 'Doll City', {
        fontFamily: 'Baloo 2, sans-serif',
        fontSize: '52px',
        color: '#3A2E4D',
      })
      .setOrigin(0.5);

    for (const building of BUILDINGS) {
      this.createBuildingIcon(building);
    }

    EventBus.emit('scene:changed', 'CityMap');
  }

  private createBuildingIcon(building: (typeof BUILDINGS)[number]): void {
    const visual = buildingVisual(building);
    const container = this.add.container(building.mapPosition.x, building.mapPosition.y);

    const icon = this.add.image(0, 0, visual.texture).setTint(colorToNumber(building.palette[0]));
    icon.setDisplaySize(150, 130);

    const label = this.add
      .text(0, 84, building.unlockState === 'locked' ? `${building.name} (soon)` : building.name, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '22px',
        color: '#3A2E4D',
        align: 'center',
      })
      .setOrigin(0.5);

    container.add([icon, label]);
    container.setSize(160, 150);

    if (building.unlockState === 'locked') {
      container.setAlpha(0.75);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          angle: { from: -4, to: 4 },
          duration: 90,
          yoyo: true,
          repeat: 3,
        });
      });
      return;
    }

    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () =>
      this.tweens.add({ targets: container, scale: 1.06, duration: 120 }),
    );
    container.on('pointerout', () =>
      this.tweens.add({ targets: container, scale: 1, duration: 120 }),
    );
    container.on('pointerdown', () => {
      gameController.goToScene(building.sceneAsset, { buildingId: building.id });
    });
  }
}
