/**
 * PURPOSE: Stages the one PNG file `shotBlankReadBroker` reads. Builds a real PNG with
 * `PNG.sync.write` from the RGBA pixel bytes a test hands in and stages it as
 * `readFileBytes`' bytes, so the REAL (unmocked) `decodePng` decodes it
 * back exactly.
 *
 * USAGE:
 * const proxy = shotBlankReadBrokerProxy();
 * proxy.stagesShot({ shotPath, width: 4, height: 4, pixels: new Uint8Array([...]) });
 */

import type { FsError } from '#gateway/node/fs';
import { readFileBytesProxy } from '#gateway/node/fs__promises/read-file-bytes/read-file-bytes.proxy';
import { PNG } from '#gateway/npm/pngjs';
import { decodePngProxy } from '#gateway/npm/pngjs/decode-png/decode-png.proxy';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

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
  stagesDefaultShot: (params: { bytes: Uint8Array }) => void;
  stagesShotReadError: (params: { shotPath: AbsoluteFilePath; error: Error }) => void;
} => {
  const readProxy = readFileBytesProxy();
  decodePngProxy();

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
      readProxy.returns({ path: shotPath, bytes: new Uint8Array(PNG.sync.write(png)) });
    },

    stagesDefaultShot: ({ bytes }: { bytes: Uint8Array }): void => {
      readProxy.returnsMatchingPath({
        path: (p: unknown) => typeof p === 'string' && p.endsWith('.png'),
        bytes,
      });
    },

    stagesShotReadError: ({
      shotPath,
      error,
    }: {
      shotPath: AbsoluteFilePath;
      error: Error;
    }): void => {
      const fsError: FsError = Object.assign(error, {
        code: 'code' in error && typeof error.code === 'string' ? error.code : 'EIO',
      });
      readProxy.throwsMatchingPath({ path: shotPath, error: fsError });
    },
  };
};
