import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { CityMapScene, GAME_HEIGHT, GAME_WIDTH } from './scenes/CityMapScene';
import { HouseScene } from './scenes/HouseScene';
import { ClothingShopScene } from './scenes/ClothingShopScene';
import { GiftAreaScene } from './scenes/GiftAreaScene';
import { gameController } from './gameController';

/**
 * Mounts a single, app-lifetime Phaser game instance. Only one scene runs at
 * a time (Phaser frees the previous scene's resources on `scene.stop`), and
 * React overlays (see features/*) render on top for menus and buttons.
 */
export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || gameController.game) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: '#F3EEFF',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [CityMapScene, HouseScene, ClothingShopScene, GiftAreaScene],
    });

    gameController.game = game;

    return () => {
      game.destroy(true);
      gameController.game = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" data-testid="phaser-root" />;
}
