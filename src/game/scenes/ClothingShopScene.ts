import Phaser from 'phaser';
import { ensureBaseShapeTextures, SHAPE } from '@/game/loaders/shapeTextures';
import { preloadShapeImages } from '@/game/loaders/shapeImages';
import clothingShopBgUrl from '@/assets/rooms/clothing-shop.png';
import { charactersById } from '@/data';
import { CHARACTER_HITBOX, CharacterView } from '@/game/entities/CharacterView';
import { makeDraggable } from '@/game/systems/DragSystem';
import { EventBus } from '@/game/EventBus';
import { useGameStore } from '@/store/gameStore';
import { colorToNumber } from '@/lib/color';
import type { DressingBoothState } from '@/game/interactions/dressingBoothMachine';
import { playSound } from '@/lib/sound';
import { GAME_HEIGHT, GAME_WIDTH } from './CityMapScene';

const SHOP_BUILDING_ID = 'clothing_shop_01';
const BOOTH_ZONE = new Phaser.Geom.Rectangle(980, 430, 240, 300);

export class ClothingShopScene extends Phaser.Scene {
  private characterViews = new Map<string, CharacterView>();
  private draggingIds = new Set<string>();
  private unsubscribe: (() => void) | null = null;
  private lastHandledBoothState: DressingBoothState | null = null;
  private curtainLeft!: Phaser.GameObjects.Image;
  private curtainRight!: Phaser.GameObjects.Image;
  private sparkles: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('ClothingShop');
  }

  preload(): void {
    preloadShapeImages(this);
    this.load.image('bg_clothingShop', clothingShopBgUrl);
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    ensureBaseShapeTextures(this);
    this.cameras.main.setBackgroundColor('#F7F0FF');
    this.lastHandledBoothState = null;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_clothingShop').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(220, 130, 'Wardrobe', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '24px',
        color: '#3A2E4D',
      })
      .setOrigin(0.5);

    // Booth backdrop - a semi-transparent drop-zone indicator over the illustrated dressing nook.
    const boothCx = BOOTH_ZONE.centerX;
    const boothCy = BOOTH_ZONE.centerY;
    this.add
      .rectangle(boothCx, boothCy, BOOTH_ZONE.width, BOOTH_ZONE.height, colorToNumber('#FFD9EE'), 0.35)
      .setStrokeStyle(4, colorToNumber('#FF8FD1'));
    this.add
      .text(boothCx, BOOTH_ZONE.y - 24, 'Dressing Booth', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '22px',
        color: '#3A2E4D',
      })
      .setOrigin(0.5);

    this.curtainLeft = this.add
      .image(boothCx - BOOTH_ZONE.width / 2 - 20, boothCy, SHAPE.curtainPanel)
      .setDisplaySize(BOOTH_ZONE.width / 2 + 10, BOOTH_ZONE.height)
      .setTint(colorToNumber('#FF5C7A'))
      .setOrigin(0, 0.5);
    this.curtainRight = this.add
      .image(boothCx + BOOTH_ZONE.width / 2 + 20, boothCy, SHAPE.curtainPanel)
      .setDisplaySize(BOOTH_ZONE.width / 2 + 10, BOOTH_ZONE.height)
      .setTint(colorToNumber('#FF5C7A'))
      .setOrigin(1, 0.5);

    this.sparkles = Array.from({ length: 6 }, (_, i) =>
      this.add
        .image(boothCx - 60 + (i % 3) * 60, boothCy - 40 + Math.floor(i / 3) * 80, SHAPE.sparkle)
        .setTint(colorToNumber(['#FFD34D', '#4DB8FF', '#FF8FD1'][i % 3]))
        .setVisible(false),
    );

    const bounds = { minX: 40, maxX: GAME_WIDTH - 40, minY: 260, maxY: GAME_HEIGHT - 40 };
    const state = useGameStore.getState().state;

    for (const [characterId, character] of Object.entries(state.characters)) {
      if (character.buildingId !== SHOP_BUILDING_ID) continue;
      const entity = charactersById.get(characterId);
      if (!entity) continue;
      const view = new CharacterView(this, character.position.x, character.position.y, entity);
      view.applyOutfitState(character.outfitState);
      view.setDepth(character.position.y);
      makeDraggable(view, CHARACTER_HITBOX, bounds, {
        onDragStart: () => this.draggingIds.add(characterId),
        onDragEnd: (x, y) => {
          this.draggingIds.delete(characterId);
          useGameStore.getState().moveCharacter(characterId, SHOP_BUILDING_ID, { x, y });
          if (BOOTH_ZONE.contains(x, y)) {
            const shop = useGameStore.getState().state.shop;
            if (shop.dressingBoothState === 'EMPTY') {
              useGameStore.getState().dispatchBoothEvent({ type: 'ENTER', characterId });
            }
          }
        },
      });
      this.characterViews.set(characterId, view);
    }

    this.applyBoothVisual(state.shop.dressingBoothState, true);
    this.unsubscribe = useGameStore.subscribe((s) => this.syncFromStore(s.state));

    EventBus.emit('scene:changed', 'ClothingShop');
  }

  private syncFromStore(state: ReturnType<typeof useGameStore.getState>['state']): void {
    for (const [characterId, view] of this.characterViews) {
      if (this.draggingIds.has(characterId)) continue;
      const saved = state.characters[characterId];
      if (!saved) continue;
      if (view.x !== saved.position.x || view.y !== saved.position.y) {
        this.tweens.add({
          targets: view,
          x: saved.position.x,
          y: saved.position.y,
          duration: 300,
          ease: 'Sine.Out',
        });
      }
      view.setDepth(saved.position.y);
      view.applyOutfitState(saved.outfitState);
    }

    if (state.shop.dressingBoothState !== this.lastHandledBoothState) {
      this.applyBoothVisual(state.shop.dressingBoothState, false);
    }
  }

  private applyBoothVisual(boothState: DressingBoothState, immediate: boolean): void {
    this.lastHandledBoothState = boothState;
    const openX = {
      left: BOOTH_ZONE.x - BOOTH_ZONE.width / 2 - 20,
      right: BOOTH_ZONE.x + BOOTH_ZONE.width * 1.5 + 20,
    };
    const closedX = { left: BOOTH_ZONE.centerX, right: BOOTH_ZONE.centerX };

    if (boothState === 'CURTAIN_CLOSING') {
      playSound('curtain');
      this.tweens.add({
        targets: this.curtainLeft,
        x: closedX.left,
        duration: 500,
        ease: 'Sine.InOut',
        onComplete: () => useGameStore.getState().dispatchBoothEvent({ type: 'CURTAIN_CLOSED' }),
      });
      this.tweens.add({
        targets: this.curtainRight,
        x: closedX.right,
        duration: 500,
        ease: 'Sine.InOut',
      });
      return;
    }

    if (boothState === 'CHANGING') {
      this.sparkles.forEach((s) => s.setVisible(true).setScale(0.4).setAlpha(1));
      this.sparkles.forEach((s) =>
        this.tweens.add({
          targets: s,
          scale: 1,
          alpha: 0,
          duration: 550,
          yoyo: false,
          ease: 'Sine.Out',
        }),
      );
      this.time.delayedCall(650, () =>
        useGameStore.getState().dispatchBoothEvent({ type: 'CHANGE_COMPLETE' }),
      );
      return;
    }

    if (boothState === 'CURTAIN_OPENING') {
      playSound('curtain');
      this.tweens.add({
        targets: this.curtainLeft,
        x: openX.left,
        duration: 500,
        ease: 'Sine.InOut',
        onComplete: () => useGameStore.getState().dispatchBoothEvent({ type: 'CURTAIN_OPENED' }),
      });
      this.tweens.add({
        targets: this.curtainRight,
        x: openX.right,
        duration: 500,
        ease: 'Sine.InOut',
      });
      return;
    }

    if (immediate || boothState === 'EMPTY') {
      this.curtainLeft.setX(openX.left);
      this.curtainRight.setX(openX.right);
      this.sparkles.forEach((s) => s.setVisible(false));
    }
  }

  shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.characterViews.clear();
    this.draggingIds.clear();
  }
}
