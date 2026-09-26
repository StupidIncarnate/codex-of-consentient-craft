/// <reference lib="dom" />
/**
 * PURPOSE: Writes one record into an object store in its own transaction. Reach for `getAll` +
 * this whenever a caller needs a targeted add rather than a whole-store rewrite.
 *
 * USAGE:
 * await put({ db, storeName: 'drafts', value: draft });
 * // Returns the key the record was stored under
 */

export const put = async ({
  db,
  storeName,
  value,
}: {
  db: IDBDatabase;
  storeName: string;
  value: unknown;
}): Promise<IDBValidKey> =>
  new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const putRequest = store.put(value);

    putRequest.onsuccess = (): void => {
      resolve(putRequest.result);
    };

    putRequest.onerror = (): void => {
      reject(
        new Error(
          `put: failed to write to ${storeName} — ${putRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });
