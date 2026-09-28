/// <reference lib="dom" />
/**
 * PURPOSE: Rewrites one object store in ONE readwrite transaction: reads every record, hands them to
 * `replace`, clears the store and re-adds what `replace` returned, in order. Reach for this over
 * `getAll` + `put` whenever the new contents depend on the old ones (keep every other scope's
 * records, tag legacy records) and no other writer may slip in between the read and the rewrite. It
 * needs no keys: the store's own key generator numbers the re-added records.
 *
 * USAGE:
 * await replaceAll({
 *   db,
 *   storeName: 'drafts',
 *   replace: ({ existing }) => [...existing.filter(isOtherScope), ...freshDrafts],
 * });
 */

export const replaceAll = async ({
  db,
  storeName,
  replace,
}: {
  db: IDBDatabase;
  storeName: string;
  replace: (params: { existing: readonly unknown[] }) => readonly unknown[];
}): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (): void => {
      try {
        const replacement = replace({ existing: getAllRequest.result });
        store.clear();
        for (const record of replacement) {
          store.add(record);
        }
      } catch (error) {
        transaction.abort();
        reject(new Error(`replaceAll: replace threw for ${storeName} — ${String(error)}`));
      }
    };

    getAllRequest.onerror = (): void => {
      reject(
        new Error(
          `replaceAll: failed to read ${storeName} — ${getAllRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };

    transaction.oncomplete = (): void => {
      resolve();
    };

    transaction.onerror = (): void => {
      reject(
        new Error(
          `replaceAll: failed to rewrite ${storeName} — ${transaction.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });
