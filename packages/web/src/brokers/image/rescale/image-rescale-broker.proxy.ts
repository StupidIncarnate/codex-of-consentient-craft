import { z } from 'zod';

import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { canvasEncode } from '#gateway/browser/HTMLCanvasElement';
import { canvasEncodeProxy } from '#gateway/browser/HTMLCanvasElement/canvas-encode/canvas-encode.proxy';
import { createImageBitmapProxy } from '#gateway/browser/createImageBitmap/create-image-bitmap/create-image-bitmap.proxy';

import { ImageSizeStub } from '../../../contracts/image-size/image-size.stub';
import type { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { base64ByteLengthTransformer } from '../../../transformers/base64-byte-length/base64-byte-length-transformer';

type ImageDataUrl = ReturnType<typeof ImageDataUrlStub>;
type ImageSize = ReturnType<typeof ImageSizeStub>;

const BASE64_MARKER = ';base64,';

// The request object `canvasEncode` receives, read back field by field without narrowing any of it.
const encodeRequestContract = z.object({
  widthPx: z.unknown(),
  heightPx: z.unknown(),
  mediaType: z.unknown(),
  quality: z.unknown(),
});

// The encode answers in the order it was staged: a ladder asks for the same (mediaType, quality)
// several times and each ask gets its own answer. Every ask carries exactly one request object.
export const imageRescaleBrokerProxy = (): {
  decodesTo: (params: {
    dataUrl?: ImageDataUrl | undefined;
    widthPx: number;
    heightPx: number;
  }) => void;
  decodeFails: (params: { dataUrl?: ImageDataUrl | undefined; error: Error }) => void;
  encodesTo: (params: { dataUrl: string }) => void;
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
  // Child creation only: every encode is answered by the `canvasEncode` mock below, which is what
  // lets one media type and quality get a different answer on each ask.
  canvasEncodeProxy();
  const encodeHandle: MockHandle = registerMock({ fn: canvasEncode });

  const isEncodeRequest = (request: unknown): boolean =>
    typeof request === 'object' && request !== null;

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
    encodesTo: ({ dataUrl }): void => {
      encodeHandle.onceFor([isEncodeRequest]).returns(dataUrl);
    },
    contextUnavailable: (): void => {
      encodeHandle
        .onceFor([isEncodeRequest])
        .throws(new Error('canvasEncode: 2d canvas context unavailable'));
    },
    getEncodeRequests: (): readonly {
      widthPx: unknown;
      heightPx: unknown;
      mediaType: unknown;
      quality: unknown;
    }[] =>
      encodeHandle
        .callsMatching([isEncodeRequest])
        .map(([request]) => encodeRequestContract.parse(request)),
    getClosedBitmapSizes: (): readonly ImageSize[] =>
      bitmapProxy
        .getClosedBitmapSizes()
        .map(({ width, height }) => ImageSizeStub({ widthPx: width, heightPx: height })),
  };
};
