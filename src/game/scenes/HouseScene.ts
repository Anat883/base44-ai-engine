import Phaser from 'phaser';
import { ensureBaseShapeTextures } from '@/game/loaders/shapeTextures';
import { charactersById, furnitureById, petsById } from '@/data';
import { CharacterView } from '@/game/entities/CharacterView';
import { PetView } from '@/game/entities/PetView';
import { FurnitureView } from '@/game/entities/FurnitureView';
import { makeDraggable } from '@/game/systems/DragSystem';
import { EventBus } from '@/game/EventBus';
import { useGameStore } from '@/store/gameStore';
import { colorToNumber } from '@/lib/color';
import { GAME_HEIGHT, GAME_WIDTH } from './CityMapScene';

const HOME_BUILDING_ID = 'home_house_01';
const FLOOR_TOP = 220;

export class HouseScene extends Phaser.Scene {
  private characterViews = new Map<string, CharacterView>();
  private petViews = new Map<string, PetView>();
  private furnitureViews = new Map<string, FurnitureView>();
  private draggingIds = new Set<string>();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super('House');
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    ensureBaseShapeTextures(this);
    this.cameras.main.setBackgroundColor('#F3EEFF');

    this.add
      .rectangle(GAME_WIDTH / 2, FLOOR_TOP / 2, GAME_WIDTH, FLOOR_TOP, colorToNumber('#FFE7A0'))
      .setAlpha(0.5);
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        FLOOR_TOP + (GAME_HEIGHT - FLOOR_TOP) / 2,
        GAME_WIDTH,
        GAME_HEIGHT - FLOOR_TOP,
        colorToNumber('#E4D9FF'),
      )
      .setAlpha(0.5);

    const bounds = {
      minX: 40,
      maxX: GAME_WIDTH - 40,
      minY: FLOOR_TOP - 40,
      maxY: GAME_HEIGHT - 40,
    };

    const state = useGameStore.getState().state;

    for (const item of state.editableHouse.furniture) {
      const furniture = furnitureById.get(item.furnitureId);
      if (!furniture) continue;
      const instanceId = item.instanceId;
      const view = new FurnitureView(this, item.position.x, item.position.y, furniture, instanceId);
      makeDraggable(view, furniture.footprint, bounds, {
        onDragStart: () => this.draggingIds.add(instanceId),
        onDragEnd: (x, y) => {
          this.draggingIds.delete(instanceId);
          useGameStore.getState().moveFurniture(instanceId, { x, y });
        },
      });
      this.furnitureViews.set(instanceId, view);
    }

    for (const [petId, pet] of Object.entries(state.pets)) {
      if (pet.buildingId !== HOME_BUILDING_ID) continue;
      const entity = petsById.get(petId);
      if (!entity) continue;
      const view = new PetView(this, pet.position.x, pet.position.y, entity);
      makeDraggable(view, { width: 84, height: 56 }, bounds, {
        onDragStart: () => this.draggingIds.add(petId),
        onDragEnd: (x, y) => {
          this.draggingIds.delete(petId);
          useGameStore.getState().movePet(petId, { x, y });
        },
      });
      this.petViews.set(petId, view);
    }

    for (const [characterId, character] of Object.entries(state.characters)) {
      if (character.buildingId !== HOME_BUILDING_ID) continue;
      const entity = charactersById.get(characterId);
      if (!entity) continue;
      const view = new CharacterView(this, character.position.x, character.position.y, entity);
      view.applyOutfitState(character.outfitState);
      makeDraggable(view, { width: 90, height: 150 }, bounds, {
        onDragStart: () => this.draggingIds.add(characterId),
        onDragEnd: (x, y) => {
          this.draggingIds.delete(characterId);
          useGameStore.getState().moveCharacter(characterId, HOME_BUILDING_ID, { x, y });
        },
      });
      this.characterViews.set(characterId, view);
    }

    this.unsubscribe = useGameStore.subscribe((s) => this.syncFromStore(s.state));

    EventBus.emit('scene:changed', 'House');
  }

  private syncFromStore(state: ReturnType<typeof useGameStore.getState>['state']): void {
    for (const [instanceId, view] of this.furnitureViews) {
      if (this.draggingIds.has(instanceId)) continue;
      const saved = state.editableHouse.furniture.find((f) => f.instanceId === instanceId);
      if (saved && (view.x !== saved.position.x || view.y !== saved.position.y)) {
        this.tweens.add({
          targets: view,
          x: saved.position.x,
          y: saved.position.y,
          duration: 300,
          ease: 'Sine.Out',
        });
      }
    }
    for (const [petId, view] of this.petViews) {
      if (this.draggingIds.has(petId)) continue;
      const saved = state.pets[petId];
      if (saved && (view.x !== saved.position.x || view.y !== saved.position.y)) {
        this.tweens.add({
          targets: view,
          x: saved.position.x,
          y: saved.position.y,
          duration: 300,
          ease: 'Sine.Out',
        });
      }
    }
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
      view.applyOutfitState(saved.outfitState);
    }
  }

  shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.characterViews.clear();
    this.petViews.clear();
    this.furnitureViews.clear();
    this.draggingIds.clear();
  }
}
