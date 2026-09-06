// PURPOSE: Proxy for pasted-image-downscale-broker providing test control over the measured
// original size and each successive re-encode the halving ladder requests.
// USAGE: Create proxy in test, stage originalIs()/reencodeYields() (or reencodeYieldsInOrder()),
// call the broker, then read back getRescaleCalls() for what the adapter was actually asked for.

import { PastedImageMediaTypeStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { canvasImageMeasureAdapterProxy } from '../../../adapters/canvas/image-measure/canvas-image-measure-adapter.proxy';
import { canvasImageRescaleAdapterProxy } from '../../../adapters/canvas/image-rescale/canvas-image-rescale-adapter.proxy';
import { ImageSizeStub } from '../../../contracts/image-size/image-size.stub';

type SizeLike = ReturnType<typeof ImageSizeStub>;
type MediaTypeLike = ReturnType<typeof PastedImageMediaTypeStub>;

// A named `type RescaleCallRecord = { ... }` object-literal alias gets auto-fixed into an
// `interface`, which ban-adhoc-types then rejects outright in brokers/ files (named object shapes
// belong in contracts/). Repeating this inline object type in the two spots that need it — same
// as every proxy method parameter's own inline type above — sidesteps both rules.
export const pastedImageDownscaleBrokerProxy = (): {
  originalIs: (params: { widthPx: number; heightPx: number }) => void;
  reencodeYields: (params: { dataUrl: string }) => void;
  reencodeYieldsInOrder: (params: { dataUrls: readonly string[] }) => void;
  decodeFails: (params: { error: Error }) => void;
  getRescaleCalls: () => readonly { size: SizeLike; mediaType: MediaTypeLike; quality: unknown }[];
} => {
  const measureProxy = canvasImageMeasureAdapterProxy();
  // Child creation only, per enforce-proxy-child-creation — the broker imports
  // canvasImageRescaleAdapter, so this proxy must instantiate its proxy too. Its own bootstrap is
  // what makes getContext/toDataURL spy-able below; its single-slot getDrawnSize()/encodesTo()
  // can't give a ladder that retries several times in one test the PER-CALL sequencing this proxy
  // needs, so the recording below uses its own handles on the same underlying spies instead.
  canvasImageRescaleAdapterProxy();

  const getContextHandle: SpyOnHandle = registerSpyOn({
    object: HTMLCanvasElement.prototype,
    method: 'getContext',
  });
  const toDataUrlHandle: SpyOnHandle = registerSpyOn({
    object: HTMLCanvasElement.prototype,
    method: 'toDataURL',
  });

  const drawnState: { size: SizeLike | undefined } = { size: undefined };
  const callState: {
    calls: { size: SizeLike; mediaType: MediaTypeLike; quality: unknown }[];
  } = { calls: [] };

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

  // One constructor-level catch-all answers every getContext('2d') call across the whole ladder —
  // every attempt draws onto the same real-looking context, and drawImage's own sw/sh args are
  // what let toDataURL's implementation below know the size it is being asked to encode.
  getContextHandle.calledWith([]).returns(mockContext);

  const stageReencode = (dataUrl: string): void => {
    toDataUrlHandle.onceFor([]).implement((mediaType: string, quality: unknown) => {
      const size = drawnState.size ?? ImageSizeStub();
      callState.calls.push({
        size,
        mediaType: PastedImageMediaTypeStub({ value: mediaType }),
        quality,
      });
      return dataUrl;
    });
  };

  return {
    originalIs: ({ widthPx, heightPx }: { widthPx: number; heightPx: number }): void => {
      measureProxy.decodesTo({ widthPx, heightPx });
    },
    reencodeYields: ({ dataUrl }: { dataUrl: string }): void => {
      stageReencode(dataUrl);
    },
    reencodeYieldsInOrder: ({ dataUrls }: { dataUrls: readonly string[] }): void => {
      dataUrls.forEach((dataUrl) => {
        stageReencode(dataUrl);
      });
    },
    decodeFails: ({ error }: { error: Error }): void => {
      measureProxy.decodeFails({ error });
    },
    getRescaleCalls: (): readonly {
      size: SizeLike;
      mediaType: MediaTypeLike;
      quality: unknown;
    }[] => callState.calls,
  };
};
