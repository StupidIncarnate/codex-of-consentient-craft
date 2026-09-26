/// <reference lib="dom" />
/**
 * PURPOSE: Removes one record from an object store by key, in its own transaction. Named
 * `deleteRecord` rather than `delete` — the outside method's own name — because `delete` is a
 * reserved word and cannot be a bound export.
 *
 * USAGE:
 * await deleteRecord({ db, storeName: 'drafts', key: recordKey });
 */

export const deleteRecord = async ({
  db,
  storeName,
  key,
}: {
  db: IDBDatabase;
  storeName: string;
  key: IDBValidKey;
}): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const deleteRequest = store.delete(key);

    deleteRequest.onsuccess = (): void => {
      resolve();
    };

    deleteRequest.onerror = (): void => {
      reject(
        new Error(
          `deleteRecord: failed to delete from ${storeName} — ${deleteRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });
