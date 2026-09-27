/**
 * PURPOSE: A real diff count, produced by actually running the real `pixelmatch` comparison
 * against two small real RGBA buffers — never a hand-typed number standing in for what the real
 * algorithm would compute.
 *
 * USAGE:
 * const diffCount = DiffCountStub();
 * // Returns the real number of differing pixels pixelmatch finds between two 2x2 images
 */
import pixelmatch from 'pixelmatch';

const WIDTH = 2;
const HEIGHT = 2;
const PIXEL_COUNT = WIDTH * HEIGHT;

const solidRgbaBuffer = ({ r, g, b }: { r: number; g: number; b: number }): Uint8Array => {
  const buffer = new Uint8Array(PIXEL_COUNT * 4);

  for (let pixelIndex = 0; pixelIndex < PIXEL_COUNT; pixelIndex += 1) {
    buffer[pixelIndex * 4] = r;
    buffer[pixelIndex * 4 + 1] = g;
    buffer[pixelIndex * 4 + 2] = b;
    buffer[pixelIndex * 4 + 3] = 255;
  }

  return buffer;
};

export const DiffCountStub = ({ differs = true }: { differs?: boolean } = {}): number => {
  const first = solidRgbaBuffer({ r: 0, g: 0, b: 0 });
  const second = differs
    ? solidRgbaBuffer({ r: 255, g: 255, b: 255 })
    : solidRgbaBuffer({ r: 0, g: 0, b: 0 });
  const output = new Uint8Array(PIXEL_COUNT * 4);

  return pixelmatch(first, second, output, WIDTH, HEIGHT, { threshold: 0.1 });
};
