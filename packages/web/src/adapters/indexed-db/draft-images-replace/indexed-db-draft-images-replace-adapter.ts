/**
 * PURPOSE: Replaces the WHOLE draft-images object store in one transaction — see
 * pastedImageDraftContract's header for why the bytes live in IndexedDB rather than beside the
 * text draft in localStorage. Reach for this over a targeted add/delete whenever a paste or a
 * delete changes which images belong to the draft: the text draft's [Pasted Image N] placeholders
 * are the only source of truth for ORDER, and a paste can land BETWEEN two existing images, so
 * insertion order and placeholder order diverge the moment anything but a plain append happens.
 * Clearing the store and re-adding every draft in the order given is what keeps a later getAll()
 * lined up with the placeholders again.
 *
 * USAGE:
 * await indexedDbDraftImagesReplaceAdapter({ drafts: [firstDraft, secondDraft] });
 * // Returns: AdapterResult — the store now holds exactly these two records, in this order
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';
import type { PastedImageDraft } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';

export const indexedDbDraftImagesReplaceAdapter = async ({
  drafts,
}: {
  drafts: readonly PastedImageDraft[];
}): Promise<AdapterResult> => {
  const { name, version, storeName } = chatComposerStatics.draftDatabase;

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = globalThis.indexedDB.open(name, version);

    openRequest.onupgradeneeded = (): void => {
      const database = openRequest.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { autoIncrement: true });
      }
    };

    openRequest.onsuccess = (): void => {
      resolve(openRequest.result);
    };

    openRequest.onerror = (): void => {
      reject(
        new Error(
          `indexedDbDraftImagesReplaceAdapter: failed to open ${name} — ${openRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  await new Promise<void>((resolve, reject) => {
    // Clear-then-add, in ONE transaction, every time — never a targeted patch. See the header:
    // insertion order alone cannot be trusted to match the placeholder order once a paste lands
    // between two existing images, so rewriting the whole store in text order is what keeps
    // getAll() and the placeholders lined up. This only runs on a paste or a delete, never on a
    // keystroke.
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    store.clear();
    for (const draft of drafts) {
      store.add(draft);
    }

    transaction.oncomplete = (): void => {
      resolve();
    };

    transaction.onerror = (): void => {
      reject(
        new Error(
          `indexedDbDraftImagesReplaceAdapter: failed to replace store — ${transaction.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  db.close();

  return { success: true as const };
};
