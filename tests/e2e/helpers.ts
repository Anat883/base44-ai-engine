import type { Page } from '@playwright/test';

/** Must match CityMapScene.GAME_WIDTH / GAME_HEIGHT. */
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 800;

/**
 * Phaser's Scale.FIT mode letterboxes/scales the canvas to fit the viewport,
 * so a world coordinate is NOT a 1:1 screen pixel. This maps a world point
 * to the actual on-screen pixel using the canvas's current bounding box.
 */
async function worldToScreen(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Phaser canvas not found');
  const scale = Math.min(box.width / GAME_WIDTH, box.height / GAME_HEIGHT);
  const offsetX = box.x + (box.width - GAME_WIDTH * scale) / 2;
  const offsetY = box.y + (box.height - GAME_HEIGHT * scale) / 2;
  return { x: offsetX + x * scale, y: offsetY + y * scale };
}

export async function clickWorld(page: Page, x: number, y: number) {
  const p = await worldToScreen(page, x, y);
  await page.mouse.click(p.x, p.y);
}

export async function dragWorld(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const start = await worldToScreen(page, from.x, from.y);
  const end = await worldToScreen(page, to.x, to.y);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move((start.x + end.x) / 2, (start.y + end.y) / 2, { steps: 5 });
  await page.mouse.move(end.x, end.y, { steps: 10 });
  await page.mouse.up();
}

export async function clickBackButton(page: Page) {
  await page.getByLabel('Back to map').click();
}

/** Reads the current player's save straight out of IndexedDB (bypassing the UI). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw IndexedDB read in a test helper
export async function readSavedState(page: Page): Promise<any> {
  return page.evaluate(() => {
    const playerId = localStorage.getItem('doll-city:player-id');
    if (!playerId) return null;
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open('doll-city', 1);
      openReq.onerror = () => reject(openReq.error);
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('game-saves', 'readonly');
        const getReq = tx.objectStore('game-saves').get(playerId);
        getReq.onsuccess = () => resolve(getReq.result ?? null);
        getReq.onerror = () => reject(getReq.error);
      };
    });
  });
}
