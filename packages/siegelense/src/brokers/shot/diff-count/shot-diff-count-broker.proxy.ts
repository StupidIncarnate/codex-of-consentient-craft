/**
 * PURPOSE: Stages the two PNG files `shotDiffCountBroker` reads. Builds a real PNG per path with
 * `PNG.sync.write` from the RGBA pixel bytes a test hands in and stages each as
 * `readFileBytes`' bytes, so the REAL `decodePng` and the REAL `pixelmatch` compute a genuinely
 * measured count.
 *
 * USAGE:
 * const proxy = shotDiffCountBrokerProxy();
 * proxy.stagesShot({ path: previousPath, width: 10, height: 10, pixels: new Uint8Array([...]) });
 */

import { Buffer } from '#gateway/node/buffer';
import { readFileBytesProxy } from '#gateway/node/fs__promises/read-file-bytes/read-file-bytes.proxy';
import { PNG } from '#gateway/npm/pngjs';
import { decodePngProxy } from '#gateway/npm/pngjs/decode-png/decode-png.proxy';

export const shotDiffCountBrokerProxy = (): {
  stagesShot: (params: { path: string; width: number; height: number; pixels: Uint8Array }) => void;
  // A low-specificity fallback so a composing proxy can give every unstaged shot path a real
  // decodable frame. A test's own `stagesShot` for a SPECIFIC path still wins.
  stagesDefaultShot: (params: { bytes: Uint8Array }) => void;
} => {
  const readProxy = readFileBytesProxy();
  decodePngProxy();

  return {
    stagesShot: ({
      path,
      width,
      height,
      pixels,
    }: {
      path: string;
      width: number;
      height: number;
      pixels: Uint8Array;
    }): void => {
      const png = new PNG({ width, height });
      png.data = Buffer.from(pixels);
      readProxy.returns({ path, bytes: new Uint8Array(PNG.sync.write(png)) });
    },

    stagesDefaultShot: ({ bytes }: { bytes: Uint8Array }): void => {
      readProxy.returnsMatchingPath({
        path: (p: unknown) => typeof p === 'string' && p.endsWith('.png'),
        bytes,
      });
    },
  };
};
