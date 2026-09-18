/**
 * PURPOSE: Stages the one PNG file `shotBlankReadBroker` reads. Builds a real PNG with
 * `PNG.sync.write` from the RGBA pixel bytes a test hands in and stages it as
 * `fsReadFileAdapter`'s `'latin1'` read, so the REAL (unmocked) `pngjsDecodeAdapter` decodes it
 * back exactly — `brokers/` itself may never import `pngjs` (enforced by
 * `@dungeonmaster/enforce-project-structure`), but this `.proxy.ts` file is exempt from that
 * boundary, so the PNG construction stays here rather than leaking into the test.
 *
 * USAGE:
 * const proxy = shotBlankReadBrokerProxy();
 * proxy.stagesShot({ shotPath, width: 4, height: 4, pixels: new Uint8Array([...]) });
 */

import { PNG } from 'pngjs';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pngjsDecodeAdapterProxy } from '../../../adapters/pngjs/decode/pngjs-decode-adapter.proxy';

export const shotBlankReadBrokerProxy = (): {
  stagesShot: (params: {
    shotPath: AbsoluteFilePath;
    width: number;
    height: number;
    pixels: Uint8Array;
  }) => void;
  // A low-specificity fallback so a caller composing this proxy (e.g. step-dispatch-broker.proxy.ts,
  // which never imports fsReadFileAdapter directly and so may not construct its own proxy for it —
  // enforce-proxy-child-creation) can give every unstaged shot path a real decodable frame. A test's
  // own `stagesShot` for a SPECIFIC path still wins — exact-path matches outrank this wildcard.
  stagesDefaultShot: (params: { content: string }) => void;
  stagesShotReadError: (params: { shotPath: AbsoluteFilePath; error: Error }) => void;
} => {
  const readProxy = fsReadFileAdapterProxy();
  pngjsDecodeAdapterProxy();

  return {
    stagesShot: ({
      shotPath,
      width,
      height,
      pixels,
    }: {
      shotPath: AbsoluteFilePath;
      width: number;
      height: number;
      pixels: Uint8Array;
    }): void => {
      const png = new PNG({ width, height });
      png.data = Buffer.from(pixels);
      readProxy.resolves({ filePath: shotPath, content: PNG.sync.write(png).toString('latin1') });
    },

    stagesDefaultShot: ({ content }: { content: string }): void => {
      readProxy.resolvesAny({ content });
    },

    stagesShotReadError: ({
      shotPath,
      error,
    }: {
      shotPath: AbsoluteFilePath;
      error: Error;
    }): void => {
      readProxy.rejects({ filePath: shotPath, error });
    },
  };
};
