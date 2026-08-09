import { expect, test } from '@playwright/test';
import { clickWorld, dragWorld, readSavedState } from './helpers';
import { SHOP_CHARACTER_POSITIONS } from '../../src/features/wardrobe/shopDefaults';

test('shop Clean Up: a wandered-off character returns to its default spot', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1500);

  await clickWorld(page, 620, 260); // enter clothing shop
  await page.waitForTimeout(600);

  // Make it messy: drag the child character far from its default spot.
  await dragWorld(page, { x: 260, y: 560 }, { x: 550, y: 720 });
  await page.waitForTimeout(900);

  const messy = await readSavedState(page);
  expect(messy.characters['child_01'].position.x).toBeCloseTo(550, -1);

  await page.getByRole('button', { name: /Clean Up/ }).click();
  await page.waitForTimeout(900);

  const tidy = await readSavedState(page);
  const expected = SHOP_CHARACTER_POSITIONS['child_01'];
  expect(tidy.characters['child_01'].position.x).toBeCloseTo(expected.x, -1);
  expect(tidy.characters['child_01'].position.y).toBeCloseTo(expected.y, -1);
});
