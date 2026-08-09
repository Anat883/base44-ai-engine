/** Converts a `#rrggbb` string into the number Phaser's tint APIs expect. */
export function colorToNumber(hex: string): number {
  const clean = hex.replace('#', '');
  return parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16) || 0x000000;
}
