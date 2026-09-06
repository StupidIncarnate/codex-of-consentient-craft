import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const canvasImageMeasureAdapterProxy = (): {
  decodesTo: (params: { widthPx: number; heightPx: number }) => void;
  decodeFails: (params: { error: Error }) => void;
  wasBitmapClosed: () => boolean;
} => {
  // jsdom does not implement `createImageBitmap` at all, so attach a real function to spy on —
  // the same reason clipboardWriteAdapterProxy defines `navigator.clipboard` before spying on it.
  // The cast to an optional field is what the clipboard proxy does too: the DOM lib types
  // `createImageBitmap` as always present, so an unwidened check reads as provably-always-falsy.
  const globalWithBitmap = globalThis as {
    createImageBitmap?: typeof globalThis.createImageBitmap;
  };

  if (!globalWithBitmap.createImageBitmap) {
    Object.defineProperty(globalThis, 'createImageBitmap', {
      value: async (_blob: Blob): Promise<ImageBitmap> =>
        Promise.reject(new Error('canvasImageMeasureAdapterProxy: no decode staged')),
      configurable: true,
      writable: true,
    });
  }

  const handle: SpyOnHandle = registerSpyOn({
    object: globalThis,
    method: 'createImageBitmap',
  });

  const closeState = { closed: false };

  return {
    // createImageBitmap takes one argument (the blob this adapter builds from the data URL's own
    // base64 payload), and that blob's content is not something the proxy can reconstruct
    // byte-for-byte to key a match on — an unaddressed `calledWith([])` is the honest description
    // of "whatever blob the adapter built", the same reasoning as a passthrough uuid/timestamp mock.
    decodesTo: ({ widthPx, heightPx }: { widthPx: number; heightPx: number }): void => {
      const bitmap = {
        width: widthPx,
        height: heightPx,
        close: (): void => {
          closeState.closed = true;
        },
      } as unknown as ImageBitmap;

      handle.calledWith([]).resolves(bitmap);
    },
    decodeFails: ({ error }: { error: Error }): void => {
      handle.calledWith([]).rejects(error);
    },
    wasBitmapClosed: (): boolean => closeState.closed,
  };
};
