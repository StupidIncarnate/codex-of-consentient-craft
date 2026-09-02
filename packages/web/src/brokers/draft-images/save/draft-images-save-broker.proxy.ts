import { indexedDbDraftImagesReplaceAdapterProxy } from '../../../adapters/indexed-db/draft-images-replace/indexed-db-draft-images-replace-adapter.proxy';
import type { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';

type PastedImageDraft = ReturnType<typeof PastedImageDraftStub>;

export const draftImagesSaveBrokerProxy = (): {
  storeAlreadyHolds: (params: { drafts: readonly PastedImageDraft[] }) => void;
  getStoredDrafts: () => readonly PastedImageDraft[];
  storeUnavailable: (params: { error: Error }) => void;
} => {
  const replaceAdapterProxy = indexedDbDraftImagesReplaceAdapterProxy();

  return {
    storeAlreadyHolds: ({ drafts }: { drafts: readonly PastedImageDraft[] }): void => {
      replaceAdapterProxy.seed({ drafts });
    },
    getStoredDrafts: (): readonly PastedImageDraft[] =>
      replaceAdapterProxy.getStoredDrafts() as readonly PastedImageDraft[],
    storeUnavailable: ({ error }: { error: Error }): void => {
      replaceAdapterProxy.openFails({ error });
    },
  };
};
