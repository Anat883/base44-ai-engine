import { expect, test } from '@playwright/test';
import { clickWorld, dragWorld, readSavedState } from './helpers';

test('editable house: moved furniture survives a full page reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1500);

  // Enter the house from the map (building at world 220,320).
  await clickWorld(page, 220, 320);
  await page.waitForTimeout(600);
  await expect(page.getByText('My House')).toBeVisible();

  // Drag the blue chair (starts at 640,460, chosen to avoid overlapping a character) to a new spot.
  await dragWorld(page, { x: 640, y: 460 }, { x: 760, y: 650 });
  await page.waitForTimeout(900);

  const before = await readSavedState(page);
  const chair = before.editableHouse.furniture.find(
    (f: { furnitureId: string }) => f.furnitureId === 'chair_blue_01',
  );
  expect(chair.position.x).toBeCloseTo(760, -1);
  expect(chair.position.y).toBeCloseTo(650, -1);
  expect(before.editableHouse.hasCustomLayout).toBe(true);

  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1500);
  await clickWorld(page, 220, 320);
  await page.waitForTimeout(600);

  const after = await readSavedState(page);
  const chairAfterReload = after.editableHouse.furniture.find(
    (f: { furnitureId: string }) => f.furnitureId === 'chair_blue_01',
  );
  expect(chairAfterReload.position.x).toBeCloseTo(760, -1);
  expect(chairAfterReload.position.y).toBeCloseTo(650, -1);
});
