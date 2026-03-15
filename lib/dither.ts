/**
 * 4×4 Bayer ordered dither — mouse-follow hover effect.
 *
 * Renders a radial dither pattern centered on the cursor.
 * The pattern fades from opaque at the cursor to transparent at the edge.
 */

// 4×4 Bayer threshold matrix (normalized 0–1)
const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
];

export interface DitherOptions {
  /** Radius of the dither glow in pixels */
  radius?: number;
  /** Size of each dither "pixel" */
  pixelSize?: number;
  /** RGBA color array [r, g, b, a] — values 0–255 */
  color?: [number, number, number, number];
}

const DEFAULTS: Required<DitherOptions> = {
  radius: 200,
  pixelSize: 4,
  color: [255, 255, 255, 13], // white at 5% opacity
};

export function drawDither(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mouseX: number,
  mouseY: number,
  opts?: DitherOptions
) {
  const { radius, pixelSize, color } = { ...DEFAULTS, ...opts };

  ctx.clearRect(0, 0, width, height);

  const startX = Math.max(0, Math.floor((mouseX - radius) / pixelSize) * pixelSize);
  const startY = Math.max(0, Math.floor((mouseY - radius) / pixelSize) * pixelSize);
  const endX = Math.min(width, Math.ceil((mouseX + radius) / pixelSize) * pixelSize);
  const endY = Math.min(height, Math.ceil((mouseY + radius) / pixelSize) * pixelSize);

  for (let y = startY; y < endY; y += pixelSize) {
    for (let x = startX; x < endX; x += pixelSize) {
      const dx = x + pixelSize / 2 - mouseX;
      const dy = y + pixelSize / 2 - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) continue;

      // Intensity falls off from center — 1 at cursor, 0 at edge
      const intensity = 1 - dist / radius;

      // Bayer threshold check
      const bx = Math.floor(x / pixelSize) % 4;
      const by = Math.floor(y / pixelSize) % 4;
      const threshold = BAYER_4X4[by]![bx]!;

      if (intensity > threshold) {
        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${(color[3] / 255) * intensity})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
      }
    }
  }
}
