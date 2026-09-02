import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { ImageSizeStub } from '../../../contracts/image-size/image-size.stub';

type ImageSizeLike = ReturnType<typeof ImageSizeStub>;

export const canvasImageRescaleAdapterProxy = (): {
  decodesTo: (params: { widthPx: number; heightPx: number }) => void;
  decodeFails: (params: { error: Error }) => void;
  encodesTo: (params: { dataUrl: string }) => void;
  contextUnavailable: () => void;
  getDrawnSize: () => ImageSizeLike | undefined;
  getEncodeArguments: () => readonly unknown[] | undefined;
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
        Promise.reject(new Error('canvasImageRescaleAdapterProxy: no decode staged')),
      configurable: true,
      writable: true,
    });
  }

  const decodeHandle: SpyOnHandle = registerSpyOn({
    object: globalThis,
    method: 'createImageBitmap',
  });

  // jsdom's HTMLCanvasElement already implements getContext — without the optional `canvas` npm
  // package it just returns null — so this guard only protects a future jsdom that drops the
  // method entirely, mirroring the createImageBitmap treatment above. Same optional-field cast:
  // the DOM lib types getContext as always present.
  const canvasProtoForContext = HTMLCanvasElement.prototype as {
    getContext?: typeof HTMLCanvasElement.prototype.getContext;
  };

  if (!canvasProtoForContext.getContext) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
      configurable: true,
      writable: true,
    });
  }

  const getContextHandle: SpyOnHandle = registerSpyOn({
    object: HTMLCanvasElement.prototype,
    method: 'getContext',
  });

  const canvasProtoForDataUrl = HTMLCanvasElement.prototype as {
    toDataURL?: typeof HTMLCanvasElement.prototype.toDataURL;
  };

  if (!canvasProtoForDataUrl.toDataURL) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      value: () => '',
      configurable: true,
      writable: true,
    });
  }

  const toDataUrlHandle: SpyOnHandle = registerSpyOn({
    object: HTMLCanvasElement.prototype,
    method: 'toDataURL',
  });

  const drawnState: { size: ImageSizeLike | undefined } = { size: undefined };

  return {
    // createImageBitmap takes one argument (the blob this adapter builds from the data URL's own
    // base64 payload), and that blob's content is not something the proxy can reconstruct
    // byte-for-byte to key a match on — an unaddressed `calledWith([])` is the honest description
    // of "whatever blob the adapter built". getContext is likewise addressed on its own catch-all:
    // this adapter only ever asks for '2d'.
    decodesTo: ({ widthPx, heightPx }: { widthPx: number; heightPx: number }): void => {
      const bitmap = {
        width: widthPx,
        height: heightPx,
        close: (): void => undefined,
      } as unknown as ImageBitmap;

      decodeHandle.calledWith([]).resolves(bitmap);

      const mockContext = {
        drawImage: (
          _image: CanvasImageSource,
          _sx: number,
          _sy: number,
          sw: number,
          sh: number,
        ): void => {
          drawnState.size = ImageSizeStub({ widthPx: sw, heightPx: sh });
        },
      } as unknown as CanvasRenderingContext2D;

      getContextHandle.calledWith([]).returns(mockContext);
    },
    decodeFails: ({ error }: { error: Error }): void => {
      decodeHandle.calledWith([]).rejects(error);
    },
    encodesTo: ({ dataUrl }: { dataUrl: string }): void => {
      toDataUrlHandle.calledWith([]).returns(dataUrl);
    },
    // Overrides the getContext staging above to null — most-recent-wins on the same address, so
    // this must be called AFTER decodesTo() in a test that wants a decoded bitmap but no context.
    contextUnavailable: (): void => {
      getContextHandle.calledWith([]).returns(null);
    },
    getDrawnSize: (): ImageSizeLike | undefined => drawnState.size,
    // toDataURL's real args are `(type?: string, quality?: unknown)` — handed back as the raw
    // recorded tuple rather than reshaped into a named type, since neither field has a branded
    // contract of its own to reach for.
    getEncodeArguments: (): readonly unknown[] | undefined => {
      const [lastCall] = [...toDataUrlHandle.callsMatching([])].slice(-1);

      return lastCall;
    },
  };
};
