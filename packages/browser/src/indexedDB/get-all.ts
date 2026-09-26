/// <reference lib="dom" />
/**
 * PURPOSE: Reads every record out of one object store, in `getAll()` order. Validating individual
 * records against a contract, and deciding what a record from a different scope means, stays the
 * caller's job — this wrapper only guards the transaction itself.
 *
 * USAGE:
 * const records = await getAll({ db, storeName: 'drafts' });
 * // Returns every record currently in the store
 */

export const getAll = async ({
  db,
  storeName,
}: {
  db: IDBDatabase;
  storeName: string;
}): Promise<unknown[]> =>
  new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (): void => {
      resolve(getAllRequest.result);
    };

    getAllRequest.onerror = (): void => {
      reject(
        new Error(
          `getAll: failed to read ${storeName} — ${getAllRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });
