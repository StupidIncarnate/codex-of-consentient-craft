/// <reference lib="dom" />
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

// A decode is addressed by its INPUT: an exact source (matched by identity, since spy addressing
// compares objects by their own keys and every Blob has none) or a predicate over it, for a caller
// whose input is built at runtime (a Blob assembled from decoded bytes). Nothing answers an input no
// method named: the spy throws on an unmatched call.
type ImageInput = ImageBitmapSource | ((value: unknown) => boolean);

export const createImageBitmapProxy = (): {
  stageBitmap: (params: { input: ImageInput; width: number; height: number }) => void;
  stageDecodeFails: (params: { input: ImageInput; error: Error }) => void;
  getRequestedInputs: () => readonly unknown[];
  getClosedBitmapSizes: () => readonly { width: number; height: number }[];
} => {
  // jsdom implements no createImageBitmap; attach a function so there is something to spy on. The
  // optional-field cast is needed because lib.dom types the global as always present.
  const globalWithBitmap = globalThis as {
    createImageBitmap?: typeof globalThis.createImageBitmap;
  };
  if (!globalWithBitmap.createImageBitmap) {
    Object.defineProperty(globalThis, 'createImageBitmap', {
      value: async (): Promise<ImageBitmap> => Promise.reject(new Error('no decode staged')),
      configurable: true,
      writable: true,
    });
  }

  const handle: SpyOnHandle = registerSpyOn({ object: globalThis, method: 'createImageBitmap' });
  const closed: { width: number; height: number }[] = [];

  return {
    stageBitmap: ({ input, width, height }): void => {
      const bitmap = {
        width,
        height,
        close: (): void => {
          closed.push({ width, height });
        },
      } as unknown as ImageBitmap;
      handle
        .calledWith([typeof input === 'function' ? input : (value: unknown) => value === input])
        .resolves(bitmap);
    },
    stageDecodeFails: ({ input, error }): void => {
      handle
        .calledWith([typeof input === 'function' ? input : (value: unknown) => value === input])
        .rejects(error);
    },
    getRequestedInputs: (): readonly unknown[] => handle.callsMatching([]).map((call) => call[0]),
    getClosedBitmapSizes: (): readonly { width: number; height: number }[] => closed,
  };
};
