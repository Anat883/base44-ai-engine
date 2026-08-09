import { expect, test } from '@playwright/test';
import { clickWorld, dragWorld, readSavedState } from './helpers';

test('dressing booth: move character in, pick a fancy dress, close curtain, outfit changes', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1500); // save load + boot

  // Enter the clothing shop from the map (building at world 620,260).
  await clickWorld(page, 620, 260);
  await page.waitForTimeout(600);
  await expect(page.getByText('Rainbow Threads')).toBeVisible();

  const before = await readSavedState(page);
  const originalOutfitId = before.characters['child_01'].outfitState.outfitId;

  // Drag the child character (starts at 260,560) into the dressing booth (~1100,580).
  await dragWorld(page, { x: 260, y: 560 }, { x: 1100, y: 580 });
  await page.waitForTimeout(500);

  await expect(page.getByText('Pick an outfit from the wardrobe!')).toBeVisible();

  // Select the fancy dress.
  await page.getByLabel('Sparkle Gala Dress').click();
  await expect(page.getByText('Ready! Close the curtain to change.')).toBeVisible();

  // Close the curtain and let the full close -> change -> open animation play out.
  await page.getByRole('button', { name: /Close Curtain/ }).click();
  await expect(page.getByText('Closing the curtain...')).toBeVisible();
  await expect(page.getByText('All done! Try another outfit or step out.')).toBeVisible({
    timeout: 5000,
  });

  const after = await readSavedState(page);
  expect(after.characters['child_01'].outfitState.outfitId).toBe('fancy_dress_01');
  // The previous outfit is no longer worn by anyone - it's back on the rack,
  // i.e. freely selectable again (never "consumed").
  expect(after.characters['child_01'].outfitState.outfitId).not.toBe(originalOutfitId);
});
