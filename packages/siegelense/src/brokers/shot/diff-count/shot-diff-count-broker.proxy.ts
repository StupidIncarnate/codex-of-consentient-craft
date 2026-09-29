/**
 * PURPOSE: Stages the two PNG files `shotDiffCountBroker` reads. Builds a real PNG per path with
 * `PNG.sync.write` from the RGBA pixel bytes a test hands in and stages each as
 * `fsReadFileAdapter`'s `'latin1'` read, so the REAL `pngjsDecodeAdapter` and the REAL
 * `pixelmatchCompareAdapter` compute a genuinely measured count.
 *
 * USAGE:
 * const proxy = shotDiffCountBrokerProxy();
 * proxy.stagesShot({ path: previousPath, width: 10, height: 10, pixels: new Uint8Array([...]) });
 */

import { PNG } from 'pngjs';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pixelmatchCompareAdapterProxy } from '../../../adapters/pixelmatch/compare/pixelmatch-compare-adapter.proxy';
import { pngjsDecodeAdapterProxy } from '../../../adapters/pngjs/decode/pngjs-decode-adapter.proxy';

export const shotDiffCountBrokerProxy = (): {
  stagesShot: (params: {
    path: AbsoluteFilePath;
    width: number;
    height: number;
    pixels: Uint8Array;
  }) => void;
  // A low-specificity fallback so a composing proxy can give every unstaged shot path a real
  // decodable frame. A test's own `stagesShot` for a SPECIFIC path still wins.
  stagesDefaultShot: (params: { content: string }) => void;
} => {
  const readProxy = fsReadFileAdapterProxy();
  pngjsDecodeAdapterProxy();
  pixelmatchCompareAdapterProxy();

  return {
    stagesShot: ({
      path,
      width,
      height,
      pixels,
    }: {
      path: AbsoluteFilePath;
      width: number;
      height: number;
      pixels: Uint8Array;
    }): void => {
      const png = new PNG({ width, height });
      png.data = Buffer.from(pixels);
      readProxy.resolves({ filePath: path, content: PNG.sync.write(png).toString('latin1') });
    },

    stagesDefaultShot: ({ content }: { content: string }): void => {
      readProxy.resolvesAny({ content });
    },
  };
};
