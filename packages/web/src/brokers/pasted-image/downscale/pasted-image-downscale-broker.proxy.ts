// PURPOSE: Proxy for pasted-image-downscale-broker providing test control over the measured
// original size and each successive re-encode the halving ladder requests.
// USAGE: Create proxy in test, stage originalIs()/reencodeYields() (or reencodeYieldsInOrder()),
// call the broker, then read back getRescaleCalls() for what the encode was actually asked for.

import { PastedImageMediaTypeStub } from '@dungeonmaster/shared/contracts';

import { imageMeasureBrokerProxy } from '../../image/measure/image-measure-broker.proxy';
import { imageRescaleBrokerProxy } from '../../image/rescale/image-rescale-broker.proxy';
import type { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { ImageSizeStub } from '../../../contracts/image-size/image-size.stub';

type SizeLike = ReturnType<typeof ImageSizeStub>;
type MediaTypeLike = ReturnType<typeof PastedImageMediaTypeStub>;
type ImageDataUrl = ReturnType<typeof ImageDataUrlStub>;

// A named `type RescaleCallRecord = { ... }` object-literal alias gets auto-fixed into an
// `interface`, which ban-adhoc-types then rejects outright in brokers/ files (named object shapes
// belong in contracts/). Repeating this inline object type in the two spots that need it — same
// as every proxy method parameter's own inline type above — sidesteps both rules.
export const pastedImageDownscaleBrokerProxy = (): {
  originalIs: (params: {
    dataUrl?: ImageDataUrl | undefined;
    widthPx: number;
    heightPx: number;
  }) => void;
  reencodeYields: (params: { dataUrl: string }) => void;
  reencodeYieldsInOrder: (params: { dataUrls: readonly string[] }) => void;
  decodeFails: (params: { dataUrl?: ImageDataUrl | undefined; error: Error }) => void;
  getRescaleCalls: () => readonly { size: SizeLike; mediaType: MediaTypeLike; quality: unknown }[];
} => {
  const measureProxy = imageMeasureBrokerProxy();
  const rescaleProxy = imageRescaleBrokerProxy();

  return {
    // The ladder decodes the same original bytes to measure it and again on every re-encode, so the
    // one decode is staged on both.
    originalIs: ({ dataUrl, widthPx, heightPx }): void => {
      measureProxy.decodesTo({ dataUrl, widthPx, heightPx });
      rescaleProxy.decodesTo({ dataUrl, widthPx, heightPx });
    },
    reencodeYields: ({ dataUrl }: { dataUrl: string }): void => {
      rescaleProxy.encodesTo({ dataUrl });
    },
    reencodeYieldsInOrder: ({ dataUrls }: { dataUrls: readonly string[] }): void => {
      dataUrls.forEach((dataUrl) => {
        rescaleProxy.encodesTo({ dataUrl });
      });
    },
    decodeFails: ({ dataUrl, error }): void => {
      measureProxy.decodeFails({ dataUrl, error });
    },
    getRescaleCalls: (): readonly {
      size: SizeLike;
      mediaType: MediaTypeLike;
      quality: unknown;
    }[] =>
      rescaleProxy.getEncodeRequests().map(({ widthPx, heightPx, mediaType, quality }) => ({
        size: ImageSizeStub({ widthPx: Number(widthPx), heightPx: Number(heightPx) }),
        mediaType: PastedImageMediaTypeStub({ value: String(mediaType) }),
        quality,
      })),
  };
};
