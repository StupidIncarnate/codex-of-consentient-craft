import { Blob } from '#gateway/browser/Blob';
import { canvasEncodeProxy } from '#gateway/browser/HTMLCanvasElement/canvas-encode/canvas-encode.proxy';
import { createImageBitmapProxy } from '#gateway/browser/createImageBitmap/create-image-bitmap/create-image-bitmap.proxy';

import { ImageSizeStub } from '../../../contracts/image-size/image-size.stub';
import type { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { base64ByteLengthTransformer } from '../../../transformers/base64-byte-length/base64-byte-length-transformer';

type ImageDataUrl = ReturnType<typeof ImageDataUrlStub>;
type ImageSize = ReturnType<typeof ImageSizeStub>;

const BASE64_MARKER = ';base64,';

// The encode answers in the order it was staged, each answer addressed by the media type and
// quality it was staged for: a ladder asks for the same (mediaType, quality) several times and each
// ask consumes its own answer. An ask nobody staged fails the test from the gateway's spy.
export const imageRescaleBrokerProxy = (): {
  decodesTo: (params: {
    dataUrl?: ImageDataUrl | undefined;
    widthPx: number;
    heightPx: number;
  }) => void;
  decodeFails: (params: { dataUrl?: ImageDataUrl | undefined; error: Error }) => void;
  encodesTo: (params: { dataUrl: string; mediaType: string; quality: number }) => void;
  contextUnavailable: () => void;
  getEncodeRequests: () => readonly {
    widthPx: unknown;
    heightPx: unknown;
    mediaType: unknown;
    quality: unknown;
  }[];
  getClosedBitmapSizes: () => readonly ImageSize[];
} => {
  const bitmapProxy = createImageBitmapProxy();
  const encodeProxy = canvasEncodeProxy();

  const blobOf = ({
    dataUrl,
  }: {
    dataUrl?: ImageDataUrl | undefined;
  }): ((value: unknown) => boolean) => {
    if (dataUrl === undefined) {
      return (value: unknown): boolean => value instanceof Blob;
    }

    const dataBase64 = dataUrl.slice(dataUrl.indexOf(BASE64_MARKER) + BASE64_MARKER.length);
    const byteLength = base64ByteLengthTransformer({ dataBase64 });

    return (value: unknown): boolean => value instanceof Blob && value.size === byteLength;
  };

  return {
    decodesTo: ({ dataUrl, widthPx, heightPx }): void => {
      bitmapProxy.stageBitmap({ input: blobOf({ dataUrl }), width: widthPx, height: heightPx });
    },
    decodeFails: ({ dataUrl, error }): void => {
      bitmapProxy.stageDecodeFails({ input: blobOf({ dataUrl }), error });
    },
    encodesTo: ({ dataUrl, mediaType, quality }): void => {
      encodeProxy.stageEncodeOnce({ mediaType, quality, dataUrl });
    },
    contextUnavailable: (): void => {
      encodeProxy.stageContextUnavailableOnce();
    },
    getEncodeRequests: (): readonly {
      widthPx: unknown;
      heightPx: unknown;
      mediaType: unknown;
      quality: unknown;
    }[] => {
      const draws = encodeProxy.getDrawCalls();

      return encodeProxy.getEncodeRequests().map(({ mediaType, quality }, index) => ({
        widthPx: draws[index]?.dWidth,
        heightPx: draws[index]?.dHeight,
        mediaType,
        quality,
      }));
    },
    getClosedBitmapSizes: (): readonly ImageSize[] =>
      bitmapProxy
        .getClosedBitmapSizes()
        .map(({ width, height }) => ImageSizeStub({ widthPx: width, heightPx: height })),
  };
};
