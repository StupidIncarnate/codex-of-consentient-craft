import { openStoreProxy } from '#gateway/browser/indexedDB/open-store/open-store.proxy';
import { replaceAllProxy } from '#gateway/browser/indexedDB/replace-all/replace-all.proxy';

import type { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

type PastedImageDraft = ReturnType<typeof PastedImageDraftStub>;

const { name, version, storeName } = chatComposerStatics.draftDatabase;

export const draftImagesSaveBrokerProxy = (): {
  storeAlreadyHolds: (params: { drafts: readonly PastedImageDraft[] }) => void;
  getStoredDrafts: () => readonly PastedImageDraft[];
  storeUnavailable: (params: { error: Error }) => void;
} => {
  const openProxy = openStoreProxy();
  replaceAllProxy();

  openProxy.seedExistingDatabase({ name, version });

  return {
    storeAlreadyHolds: ({ drafts }: { drafts: readonly PastedImageDraft[] }): void => {
      openProxy.seedRecords({ name, storeName, records: drafts });
    },
    getStoredDrafts: (): readonly PastedImageDraft[] =>
      openProxy.getRecords({ name, storeName }) as readonly PastedImageDraft[],
    storeUnavailable: ({ error }: { error: Error }): void => {
      openProxy.seedOpenRefused({ name, version, message: error.message });
    },
  };
};
