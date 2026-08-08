import Phaser from 'phaser';
import bodyUrl from '@/assets/characters/body.png';
import headUrl from '@/assets/characters/head.png';
import hairShortUrl from '@/assets/characters/hair-short.png';
import outfitShirtUrl from '@/assets/characters/outfit-shirt.png';
import outfitDressUrl from '@/assets/characters/outfit-dress.png';
import outfitTrimUrl from '@/assets/characters/outfit-trim.png';
import glassesUrl from '@/assets/characters/glasses.png';
import hairBowUrl from '@/assets/characters/hair-bow.png';
import { SHAPE } from './shapeTextures';

/**
 * Illustrated PNGs that replace their procedural-shape counterpart under the
 * same SHAPE texture key. `ensureBaseShapeTextures` only generates a texture
 * if the key doesn't already exist, so loading these first (in `preload`)
 * makes it skip straight past them. Layers with no illustrated asset yet
 * (sunglasses, earring) keep using the procedural Graphics shape.
 * hair-long.png is also excluded even though the file exists: it was
 * processed without a transparent face cutout (unlike hair-short.png), so
 * it fully masks the face — needs to be regenerated before it can replace
 * the procedural long-hair shape.
 */
const CHARACTER_ART_SOURCES: Partial<Record<string, string>> = {
  [SHAPE.bodyCapsule]: bodyUrl,
  [SHAPE.headCircle]: headUrl,
  [SHAPE.hairShort]: hairShortUrl,
  [SHAPE.outfitShirt]: outfitShirtUrl,
  [SHAPE.outfitDress]: outfitDressUrl,
  [SHAPE.outfitTrim]: outfitTrimUrl,
  [SHAPE.glasses]: glassesUrl,
  [SHAPE.hairBow]: hairBowUrl,
};

export function preloadCharacterArt(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(CHARACTER_ART_SOURCES)) {
    if (!scene.textures.exists(key)) {
      scene.load.image(key, url);
    }
  }
}
