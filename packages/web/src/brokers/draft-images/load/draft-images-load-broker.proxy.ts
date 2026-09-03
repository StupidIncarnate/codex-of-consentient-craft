import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { canvasImageMeasureAdapterProxy } from '../../../adapters/canvas/image-measure/canvas-image-measure-adapter.proxy';
import { indexedDbDraftImagesReadAdapterProxy } from '../../../adapters/indexed-db/draft-images-read/indexed-db-draft-images-read-adapter.proxy';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';
import type { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';

type PastedImageDraft = ReturnType<typeof PastedImageDraftStub>;

export const draftImagesLoadBrokerProxy = (): {
  storeHolds: (params: { drafts: readonly PastedImageDraft[] }) => void;
  // Distinct from storeHolds: it seeds records the REAL read adapter has to run its own
  // pastedImageDraftContract.safeParse against, so a test can stage a record that fails that
  // contract (the case storeHolds's typed PastedImageDraft[] cannot express) and prove the hole it
  // leaves survives through this broker's own Promise.allSettled pass untouched.
  storeHoldsRaw: (params: { records: readonly unknown[] }) => void;
  measures: (params: { dataUrl: ImageDataUrl; widthPx: number; heightPx: number }) => void;
  measureFails: (params: { dataUrl: ImageDataUrl; error: Error }) => void;
  storeUnavailable: (params: { error: Error }) => void;
} => {
  const readProxy = indexedDbDraftImagesReadAdapterProxy();

  // Called only for its environment setup — it stubs globalThis.createImageBitmap when jsdom has
  // none and installs the shared spy dispatcher. Its OWN decodesTo/decodeFails stage a durable,
  // sticky answer, which cannot give two drafts in the SAME test two different outcomes, and the
  // one case this broker exists for (one draft's measure rejects, the rest still load) needs
  // exactly that. So this proxy stages its own answers below via a second handle on the same spy —
  // see the mocking-mechanics doc on onceFor: entries are consumed in registration order, so
  // calling measures()/measureFails() in the order the test wants its drafts answered is enough.
  canvasImageMeasureAdapterProxy();

  const measureHandle = registerSpyOn({ object: globalThis, method: 'createImageBitmap' });

  return {
    storeHolds: ({ drafts }: { drafts: readonly PastedImageDraft[] }): void => {
      readProxy.seed({ drafts });
    },
    storeHoldsRaw: ({ records }: { records: readonly unknown[] }): void => {
      readProxy.seed({ drafts: records });
    },
    // dataUrl is part of the call signature for readability at the call site only. createImageBitmap
    // is called with the blob this adapter built FROM that data URL, and — same reasoning as
    // canvasImageMeasureAdapterProxy's own decodesTo — that blob cannot be reconstructed
    // byte-for-byte here to key a match on.
    measures: ({
      dataUrl: _dataUrl,
      widthPx,
      heightPx,
    }: {
      dataUrl: ImageDataUrl;
      widthPx: number;
      heightPx: number;
    }): void => {
      const bitmap = {
        width: widthPx,
        height: heightPx,
        close: (): void => undefined,
      } as unknown as ImageBitmap;

      measureHandle.onceFor([]).resolves(bitmap);
    },
    measureFails: ({ dataUrl: _dataUrl, error }: { dataUrl: ImageDataUrl; error: Error }): void => {
      measureHandle.onceFor([]).rejects(error);
    },
    storeUnavailable: ({ error }: { error: Error }): void => {
      readProxy.openFails({ error });
    },
  };
};
