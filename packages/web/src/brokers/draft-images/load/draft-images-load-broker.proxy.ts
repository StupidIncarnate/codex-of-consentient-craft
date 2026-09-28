import { draftImagesReadBrokerProxy } from '../read/draft-images-read-broker.proxy';
import { imageMeasureBrokerProxy } from '../../image/measure/image-measure-broker.proxy';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';
import type { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';

type PastedImageDraft = ReturnType<typeof PastedImageDraftStub>;

export const draftImagesLoadBrokerProxy = (): {
  storeHolds: (params: { drafts: readonly PastedImageDraft[] }) => void;
  // Distinct from storeHolds: it seeds records the REAL read broker has to run its own
  // pastedImageDraftContract.safeParse against, so a test can stage a record that fails that
  // contract (the case storeHolds's typed PastedImageDraft[] cannot express) and prove the hole it
  // leaves survives through this broker's own Promise.allSettled pass untouched.
  storeHoldsRaw: (params: { records: readonly unknown[] }) => void;
  // A decode is addressed by the byte length of `dataUrl`'s payload, so two drafts in one test
  // whose payloads decode to the same length share one staging.
  measures: (params: { dataUrl: ImageDataUrl; widthPx: number; heightPx: number }) => void;
  measureFails: (params: { dataUrl: ImageDataUrl; error: Error }) => void;
  storeUnavailable: (params: { error: Error }) => void;
} => {
  const readProxy = draftImagesReadBrokerProxy();
  const measureProxy = imageMeasureBrokerProxy();

  return {
    storeHolds: ({ drafts }: { drafts: readonly PastedImageDraft[] }): void => {
      readProxy.seed({ drafts });
    },
    storeHoldsRaw: ({ records }: { records: readonly unknown[] }): void => {
      readProxy.seed({ drafts: records });
    },
    measures: ({ dataUrl, widthPx, heightPx }): void => {
      measureProxy.decodesTo({ dataUrl, widthPx, heightPx });
    },
    measureFails: ({ dataUrl, error }): void => {
      measureProxy.decodeFails({ dataUrl, error });
    },
    storeUnavailable: ({ error }: { error: Error }): void => {
      readProxy.openFails({ error });
    },
  };
};
