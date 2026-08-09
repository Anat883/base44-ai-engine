import Phaser from 'phaser';
import { ensureBaseShapeTextures, SHAPE } from '@/game/loaders/shapeTextures';
import { preloadShapeImages } from '@/game/loaders/shapeImages';
import { giftsById, holdableItemsById, outfitsById, accessoriesById } from '@/data';
import { giftVisual } from '@/game/loaders/entityVisuals';
import { colorToNumber } from '@/lib/color';
import { EventBus } from '@/game/EventBus';
import { useGameStore } from '@/store/gameStore';
import { isDailyGiftAvailable } from '@/features/gifts/dailyGift';
import { playSound } from '@/lib/sound';
import { GAME_WIDTH } from './CityMapScene';

const SHELF_ZONE = new Phaser.Geom.Rectangle(60, 560, 420, 160);
const GIFT_SPOT = { x: GAME_WIDTH / 2, y: 380 };

function contentTexture(
  contentsItemId: string,
  contentsItemType: string,
): { texture: string; color: string } {
  if (contentsItemType === 'holdableItem') {
    const item = holdableItemsById.get(contentsItemId);
    return { texture: SHAPE.bag, color: item?.primaryColor ?? '#FF8FD1' };
  }
  if (contentsItemType === 'outfit') {
    const outfit = outfitsById.get(contentsItemId);
    return { texture: SHAPE.outfitShirt, color: outfit?.primaryColor ?? '#4DB8FF' };
  }
  const accessory = accessoriesById.get(contentsItemId);
  return { texture: SHAPE.crown, color: accessory?.primaryColor ?? '#FFD34D' };
}

export class GiftAreaScene extends Phaser.Scene {
  private giftSprite!: Phaser.GameObjects.Image;
  private giftLabel!: Phaser.GameObjects.Text;
  private shelfItems: Phaser.GameObjects.Image[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super('GiftArea');
  }

  preload(): void {
    preloadShapeImages(this);
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    ensureBaseShapeTextures(this);
    this.cameras.main.setBackgroundColor('#E7FBEF');

    this.add
      .text(GAME_WIDTH / 2, 60, 'Gift Garden', {
        fontFamily: 'Baloo 2, sans-serif',
        fontSize: '40px',
        color: '#3A2E4D',
      })
      .setOrigin(0.5);

    this.add
      .image(SHELF_ZONE.centerX, SHELF_ZONE.centerY, SHAPE.shelf)
      .setDisplaySize(SHELF_ZONE.width, SHELF_ZONE.height)
      .setTint(colorToNumber('#B98CFF'));
    this.add
      .text(SHELF_ZONE.centerX, SHELF_ZONE.y - 18, 'Gift Shelf', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '20px',
        color: '#3A2E4D',
      })
      .setOrigin(0.5);

    this.giftSprite = this.add
      .image(GIFT_SPOT.x, GIFT_SPOT.y, SHAPE.giftBox)
      .setDisplaySize(140, 140)
      .setInteractive({ useHandCursor: true });
    this.giftLabel = this.add
      .text(GIFT_SPOT.x, GIFT_SPOT.y + 100, '', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '22px',
        color: '#3A2E4D',
        align: 'center',
      })
      .setOrigin(0.5);

    this.giftSprite.on('pointerdown', () => this.handleGiftTap());

    this.render(useGameStore.getState().state);
    this.unsubscribe = useGameStore.subscribe((s) => this.render(s.state));

    EventBus.emit('scene:changed', 'GiftArea');
  }

  private handleGiftTap(): void {
    const { gifts } = useGameStore.getState().state;
    if (isDailyGiftAvailable(gifts.lastGiftDate, gifts.pendingGiftId)) {
      useGameStore.getState().claimDailyGift();
      playSound('pop');
      this.tweens.add({
        targets: this.giftSprite,
        scale: { from: 0.7, to: 1 },
        duration: 300,
        ease: 'Back.Out',
      });
      return;
    }
    if (gifts.pendingGiftId && !gifts.isOpened) {
      useGameStore.getState().openPendingGift();
      playSound('giftOpen');
      this.tweens.add({
        targets: this.giftSprite,
        angle: { from: -8, to: 8 },
        duration: 90,
        yoyo: true,
        repeat: 3,
      });
    }
  }

  private render(state: ReturnType<typeof useGameStore.getState>['state']): void {
    const { gifts } = state;

    if (gifts.pendingGiftId) {
      const gift = giftsById.get(gifts.pendingGiftId);
      if (gift) {
        if (gifts.isOpened) {
          const visual = contentTexture(gift.contentsItemId, gift.contentsItemType);
          this.giftSprite.setTexture(visual.texture).setTint(colorToNumber(visual.color));
          this.giftLabel.setText(
            `You got: ${gift.name.replace(' Gift', '')}! Drag to the shelf to keep it safe.`,
          );
          this.makeGiftDraggable(gifts.pendingGiftInstanceId!);
        } else {
          const visual = giftVisual(gift);
          this.giftSprite.setTexture(visual.texture).setTint(colorToNumber(visual.color));
          this.giftLabel.setText('Tap to open your gift!');
          this.giftSprite.disableInteractive();
          this.giftSprite.setInteractive({ useHandCursor: true });
        }
      }
    } else if (isDailyGiftAvailable(gifts.lastGiftDate, gifts.pendingGiftId)) {
      this.giftSprite.setTexture(SHAPE.giftBox).setTint(colorToNumber('#FFD34D'));
      this.giftLabel.setText('Tap for your daily gift!');
      this.giftSprite.disableInteractive();
      this.giftSprite.setInteractive({ useHandCursor: true });
    } else {
      this.giftSprite.setTexture(SHAPE.giftBox).setTint(colorToNumber('#C9C2DB'));
      this.giftLabel.setText('Come back tomorrow for a new gift!');
      this.giftSprite.disableInteractive();
    }

    this.renderShelf(state);
  }

  private makeGiftDraggable(instanceId: string): void {
    this.giftSprite.disableInteractive();
    this.giftSprite.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(this.giftSprite);
    this.giftSprite.removeAllListeners('drag');
    this.giftSprite.removeAllListeners('dragend');
    this.giftSprite.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => {
      this.giftSprite.x = x;
      this.giftSprite.y = y;
    });
    this.giftSprite.on('dragend', () => {
      if (SHELF_ZONE.contains(this.giftSprite.x, this.giftSprite.y)) {
        useGameStore.getState().storeGift(instanceId);
      } else {
        this.tweens.add({
          targets: this.giftSprite,
          x: GIFT_SPOT.x,
          y: GIFT_SPOT.y,
          duration: 250,
        });
      }
    });
  }

  private renderShelf(state: ReturnType<typeof useGameStore.getState>['state']): void {
    this.shelfItems.forEach((item) => item.destroy());
    this.shelfItems = [];

    state.gifts.storage.forEach((entry, index) => {
      const gift = giftsById.get(entry.giftId);
      if (!gift) return;
      const visual = contentTexture(gift.contentsItemId, gift.contentsItemType);
      const col = index % 5;
      const row = Math.floor(index / 5);
      const x = SHELF_ZONE.x + 50 + col * 70;
      const y = SHELF_ZONE.y + 40 + row * 60;
      const icon = this.add
        .image(x, y, visual.texture)
        .setDisplaySize(46, 46)
        .setTint(colorToNumber(visual.color))
        .setInteractive({ useHandCursor: true });
      icon.on('pointerdown', () => useGameStore.getState().retrieveGift(entry.giftInstanceId));
      this.shelfItems.push(icon);
    });
  }

  shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.shelfItems.forEach((i) => i.destroy());
    this.shelfItems = [];
  }
}
