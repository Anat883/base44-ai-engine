import Phaser from 'phaser';

/**
 * Holds the single, app-lifetime Phaser.Game instance so React overlays
 * (back buttons, nav) can tell the world to switch scenes without prop-
 * drilling the game instance through the component tree.
 */
class GameController {
  game: Phaser.Game | null = null;

  goToScene(key: string, data?: Record<string, unknown>): void {
    if (!this.game) return;
    const active = this.game.scene.getScenes(true)[0];
    if (active) {
      this.game.scene.stop(active.scene.key);
    }
    this.game.scene.start(key, data);
  }
}

export const gameController = new GameController();
