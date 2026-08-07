import Phaser from 'phaser';

export interface DragBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface DragCallbacks {
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onTap?: () => void;
}

const PADDING = 16; // forgiving drag/tap area beyond the visual shape, per child-friendly UX rules

/**
 * Reusable touch/mouse drag behaviour shared by every draggable world object
 * (characters, pets, furniture, held items). Clamps to `bounds` so nothing
 * can be dragged off-screen or behind other UI, and restores draw order on
 * drop.
 */
export function makeDraggable(
  gameObject: Phaser.GameObjects.Container,
  hitSize: { width: number; height: number },
  bounds: DragBounds,
  callbacks: DragCallbacks = {},
): void {
  const baseDepth = gameObject.depth;
  gameObject.setSize(hitSize.width + PADDING * 2, hitSize.height + PADDING * 2);
  gameObject.setInteractive({ useHandCursor: true });
  gameObject.scene.input.setDraggable(gameObject);

  let moved = false;

  gameObject.on('dragstart', () => {
    moved = false;
    gameObject.setDepth(9999);
    callbacks.onDragStart?.();
  });

  gameObject.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
    moved = true;
    gameObject.x = Phaser.Math.Clamp(dragX, bounds.minX, bounds.maxX);
    gameObject.y = Phaser.Math.Clamp(dragY, bounds.minY, bounds.maxY);
  });

  gameObject.on('dragend', () => {
    gameObject.setDepth(baseDepth);
    if (moved) {
      callbacks.onDragEnd?.(gameObject.x, gameObject.y);
    } else {
      callbacks.onTap?.();
    }
  });
}
