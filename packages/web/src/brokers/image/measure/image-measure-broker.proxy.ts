import { Blob } from '#gateway/browser/Blob';
import { createImageBitmapProxy } from '#gateway/browser/createImageBitmap/create-image-bitmap/create-image-bitmap.proxy';

import { ImageSizeStub } from '../../../contracts/image-size/image-size.stub';
import type { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { base64ByteLengthTransformer } from '../../../transformers/base64-byte-length/base64-byte-length-transformer';

type ImageDataUrl = ReturnType<typeof ImageDataUrlStub>;
type ImageSize = ReturnType<typeof ImageSizeStub>;

const BASE64_MARKER = ';base64,';

// Stages the decode by the input the broker builds from `dataUrl`: a Blob of exactly that payload's
// byte length, or any Blob when no `dataUrl` is given. Bytes cannot be compared synchronously, so two data URLs whose payloads decode to the
// same length share one staging.
export const imageMeasureBrokerProxy = (): {
  decodesTo: (params: {
    dataUrl?: ImageDataUrl | undefined;
    widthPx: number;
    heightPx: number;
  }) => void;
  decodeFails: (params: { dataUrl?: ImageDataUrl | undefined; error: Error }) => void;
  getClosedBitmapSizes: () => readonly ImageSize[];
} => {
  const bitmapProxy = createImageBitmapProxy();

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
    getClosedBitmapSizes: (): readonly ImageSize[] =>
      bitmapProxy
        .getClosedBitmapSizes()
        .map(({ width, height }) => ImageSizeStub({ widthPx: width, heightPx: height })),
  };
};
