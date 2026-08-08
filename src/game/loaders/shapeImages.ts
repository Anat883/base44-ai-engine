import Phaser from 'phaser';
import { SHAPE } from './shapeTextures';

import headUrl from '@/assets/characters/head.png';
import bodyUrl from '@/assets/characters/body.png';
import hairShortUrl from '@/assets/characters/hair-short.png';
import outfitShirtUrl from '@/assets/characters/outfit-shirt.png';
import outfitDressUrl from '@/assets/characters/outfit-dress.png';
import outfitTrimUrl from '@/assets/characters/outfit-trim.png';
import glassesUrl from '@/assets/characters/glasses.png';
import hairBowUrl from '@/assets/characters/hair-bow.png';

/**
 * Illustrated (Toca Boca-style) replacements for a subset of SHAPE keys.
 * Anything not listed here keeps falling back to the procedural Graphics
 * shapes drawn by `ensureBaseShapeTextures` - both are plain white-fill /
 * black-outline art tinted at runtime, so the two sources mix safely.
 *
 * hair-long.png is deliberately excluded: unlike hair-short.png, it was
 * processed without a transparent face cutout (solid fill through most of
 * the canvas, confirmed by sampling alpha), so it fully masks the face.
 * Long hair keeps using the procedural shape until that asset is
 * regenerated with a proper opening.
 */
const SHAPE_IMAGE_SOURCES: Partial<Record<(typeof SHAPE)[keyof typeof SHAPE], string>> = {
  [SHAPE.headCircle]: headUrl,
  [SHAPE.bodyCapsule]: bodyUrl,
  [SHAPE.hairShort]: hairShortUrl,
  [SHAPE.outfitShirt]: outfitShirtUrl,
  [SHAPE.outfitDress]: outfitDressUrl,
  [SHAPE.outfitTrim]: outfitTrimUrl,
  [SHAPE.glasses]: glassesUrl,
  [SHAPE.hairBow]: hairBowUrl,
};

/** Queue the illustrated shape PNGs for loading. Call from a scene's `preload()`. */
export function preloadShapeImages(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(SHAPE_IMAGE_SOURCES)) {
    if (!scene.textures.exists(key)) {
      scene.load.image(key, url);
    }
  }
}
