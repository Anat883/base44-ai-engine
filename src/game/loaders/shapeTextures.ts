import Phaser from 'phaser';

/**
 * Doll City's entire placeholder art style: a small library of plain white
 * silhouette shapes generated once per texture key and re-tinted at runtime
 * per entity color (`setTint`). This keeps every visual 100% original,
 * avoids shipping any external image assets, and reuses GPU textures
 * instead of generating a new one per color combination.
 */
export const SHAPE = {
  headCircle: 'shape_head_circle',
  bodyCapsule: 'shape_body_capsule',
  outfitDress: 'shape_outfit_dress',
  outfitShirt: 'shape_outfit_shirt',
  outfitTrim: 'shape_outfit_trim',
  hairShort: 'shape_hair_short',
  hairLong: 'shape_hair_long',
  glasses: 'shape_glasses',
  sunglasses: 'shape_sunglasses',
  earring: 'shape_earring',
  hairBow: 'shape_hair_bow',
  crown: 'shape_crown',
  bag: 'shape_bag',
  rectItem: 'shape_rect_item',
  star: 'shape_star',
  petBody: 'shape_pet_body',
  petEarRound: 'shape_pet_ear_round',
  petEarPointy: 'shape_pet_ear_pointy',
  softRect: 'shape_soft_rect',
  sofa: 'shape_sofa',
  roundTable: 'shape_round_table',
  chair: 'shape_chair',
  giftBox: 'shape_gift_box',
  houseBuilding: 'shape_house_building',
  shopBuilding: 'shape_shop_building',
  giftBuilding: 'shape_gift_building',
  lockedBuilding: 'shape_locked_building',
  shelf: 'shape_shelf',
  sparkle: 'shape_sparkle',
  curtainPanel: 'shape_curtain_panel',
  rack: 'shape_rack',
} as const;

function makeTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (g: Phaser.GameObjects.Graphics) => void,
): string {
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 });
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
  return key;
}

const WHITE = 0xffffff;

export function ensureBaseShapeTextures(scene: Phaser.Scene): void {
  makeTexture(scene, SHAPE.headCircle, 48, 48, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillCircle(24, 24, 22);
  });

  makeTexture(scene, SHAPE.bodyCapsule, 56, 74, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(4, 0, 48, 74, 22);
  });

  makeTexture(scene, SHAPE.outfitDress, 60, 56, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillTriangle(30, 0, 0, 56, 60, 56);
    g.fillRoundedRect(14, 0, 32, 20, 10);
  });

  makeTexture(scene, SHAPE.outfitShirt, 52, 40, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 0, 52, 40, 14);
  });

  makeTexture(scene, SHAPE.outfitTrim, 56, 12, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 0, 56, 12, 6);
  });

  makeTexture(scene, SHAPE.hairShort, 56, 34, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillEllipse(28, 16, 56, 32);
  });

  makeTexture(scene, SHAPE.hairLong, 60, 78, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillEllipse(30, 16, 60, 34);
    g.fillRoundedRect(2, 12, 14, 60, 7);
    g.fillRoundedRect(44, 12, 14, 60, 7);
  });

  makeTexture(scene, SHAPE.glasses, 40, 16, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillCircle(10, 8, 8);
    g.fillCircle(30, 8, 8);
    g.fillRect(16, 6, 8, 4);
  });

  makeTexture(scene, SHAPE.sunglasses, 40, 16, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(1, 2, 16, 12, 5);
    g.fillRoundedRect(23, 2, 16, 12, 5);
    g.fillRect(17, 6, 6, 4);
  });

  makeTexture(scene, SHAPE.earring, 8, 10, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillCircle(4, 5, 4);
  });

  makeTexture(scene, SHAPE.hairBow, 36, 22, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillTriangle(18, 11, 0, 0, 0, 22);
    g.fillTriangle(18, 11, 36, 0, 36, 22);
    g.fillCircle(18, 11, 6);
  });

  makeTexture(scene, SHAPE.crown, 40, 26, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillPoints(
      [
        { x: 0, y: 26 },
        { x: 0, y: 12 },
        { x: 8, y: 20 },
        { x: 14, y: 2 },
        { x: 20, y: 14 },
        { x: 26, y: 2 },
        { x: 32, y: 20 },
        { x: 40, y: 12 },
        { x: 40, y: 26 },
      ],
      true,
    );
  });

  makeTexture(scene, SHAPE.bag, 34, 30, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 8, 34, 22, 8);
    g.lineStyle(4, WHITE, 1);
    g.beginPath();
    g.arc(17, 8, 10, Math.PI, 0, false);
    g.strokePath();
  });

  makeTexture(scene, SHAPE.rectItem, 26, 38, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 0, 26, 38, 6);
  });

  makeTexture(scene, SHAPE.star, 36, 36, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillPoints(starPoints(18, 18, 5, 17, 7), true);
  });

  makeTexture(scene, SHAPE.petBody, 70, 46, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillEllipse(35, 26, 70, 40);
    g.fillCircle(58, 16, 16);
  });

  makeTexture(scene, SHAPE.petEarRound, 16, 16, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillCircle(8, 8, 8);
  });

  makeTexture(scene, SHAPE.petEarPointy, 16, 18, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillTriangle(0, 18, 8, 0, 16, 18);
  });

  makeTexture(scene, SHAPE.softRect, 100, 100, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 0, 100, 100, 24);
  });

  makeTexture(scene, SHAPE.sofa, 160, 96, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 20, 160, 70, 22);
    g.fillRoundedRect(0, 0, 34, 90, 16);
    g.fillRoundedRect(126, 0, 34, 90, 16);
  });

  makeTexture(scene, SHAPE.roundTable, 90, 90, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillCircle(45, 45, 45);
  });

  makeTexture(scene, SHAPE.chair, 50, 60, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 20, 50, 40, 12);
    g.fillRoundedRect(4, 0, 42, 22, 10);
  });

  makeTexture(scene, SHAPE.giftBox, 56, 56, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 8, 56, 48, 8);
    g.fillRoundedRect(0, 0, 56, 16, 6);
  });

  makeTexture(scene, SHAPE.houseBuilding, 160, 140, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(10, 50, 140, 90, 20);
    g.fillTriangle(80, 0, 0, 60, 160, 60);
  });

  makeTexture(scene, SHAPE.shopBuilding, 160, 140, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(10, 40, 140, 100, 16);
    for (let i = 0; i < 6; i += 1) {
      g.fillTriangle(10 + i * 23.3, 40, 10 + (i + 0.5) * 23.3, 16, 10 + (i + 1) * 23.3, 40);
    }
  });

  makeTexture(scene, SHAPE.giftBuilding, 160, 140, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(20, 50, 120, 90, 30);
    g.fillCircle(80, 40, 26);
  });

  makeTexture(scene, SHAPE.lockedBuilding, 160, 140, (g) => {
    g.fillStyle(WHITE, 0.55);
    g.fillRoundedRect(20, 50, 120, 80, 24);
    g.fillRoundedRect(60, 30, 40, 34, 10);
  });

  makeTexture(scene, SHAPE.shelf, 120, 90, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 0, 120, 90, 12);
  });

  makeTexture(scene, SHAPE.sparkle, 20, 20, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillPoints(starPoints(10, 10, 4, 10, 3), true);
  });

  makeTexture(scene, SHAPE.curtainPanel, 40, 220, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 0, 40, 220, 6);
  });

  makeTexture(scene, SHAPE.rack, 140, 100, (g) => {
    g.fillStyle(WHITE, 1);
    g.fillRoundedRect(0, 0, 140, 10, 4);
    g.fillRect(6, 0, 6, 100);
    g.fillRect(128, 0, 6, 100);
  });
}

function starPoints(
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
): Phaser.Geom.Point[] {
  const points: Phaser.Geom.Point[] = [];
  const step = Math.PI / spikes;
  let angle = -Math.PI / 2;
  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push(
      new Phaser.Geom.Point(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius),
    );
    angle += step;
  }
  return points;
}
