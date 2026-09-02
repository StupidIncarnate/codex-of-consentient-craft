/**
 * PURPOSE: Reads every draft image back out of IndexedDB on reload — see
 * pastedImageDraftContract's header for why the bytes live there rather than beside the text
 * draft in localStorage. A record that fails to parse is DROPPED rather than thrown: it is data a
 * previous version of the app left on the user's disk, and one malformed row must not make the
 * whole composer refuse to open.
 *
 * USAGE:
 * const drafts = await indexedDbDraftImagesReadAdapter();
 * // Returns: readonly PastedImageDraft[] — every still-valid record, in getAll() order
 */

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';
import { pastedImageDraftContract } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import type { PastedImageDraft } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';

export const indexedDbDraftImagesReadAdapter = async (): Promise<readonly PastedImageDraft[]> => {
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
          `indexedDbDraftImagesReadAdapter: failed to open ${name} — ${openRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  const records = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (): void => {
      resolve(getAllRequest.result);
    };

    getAllRequest.onerror = (): void => {
      reject(
        new Error(
          `indexedDbDraftImagesReadAdapter: failed to read store — ${getAllRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  db.close();

  // A record that fails pastedImageDraftContract is data a previous version of the app left on
  // disk — dropped here, explicitly, rather than thrown, so one bad row cannot make the whole
  // composer unopenable on reload.
  const drafts: PastedImageDraft[] = [];
  for (const record of records) {
    const parsed = pastedImageDraftContract.safeParse(record);
    if (parsed.success) {
      drafts.push(parsed.data);
    }
  }
  return drafts;
};
