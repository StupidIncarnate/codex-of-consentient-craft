/**
 * PURPOSE: A real decoded PNG, produced by first ENCODING a small real image with `pngjs`'s own
 * `PNG.sync.write()`, then decoding those real bytes back through this subpath's own `decodePng`
 * wrapper — never a hand-typed `{width, height, pixels}` object standing in for what the real
 * codec round-trip actually produces.
 *
 * USAGE:
 * const decoded = DecodePngResultStub();
 * // Returns the real { width, height, pixels } decodePng() produces for a solid 2x2 red PNG
 */
import { PNG } from 'pngjs';
import { decodePng } from './decode-png';

const WIDTH = 2;
const HEIGHT = 2;

export const DecodePngResultStub = (): ReturnType<typeof decodePng> => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });

  for (let pixelIndex = 0; pixelIndex < WIDTH * HEIGHT; pixelIndex += 1) {
    png.data[pixelIndex * 4] = 255;
    png.data[pixelIndex * 4 + 1] = 0;
    png.data[pixelIndex * 4 + 2] = 0;
    png.data[pixelIndex * 4 + 3] = 255;
  }

  return decodePng({ bytes: PNG.sync.write(png) });
};
