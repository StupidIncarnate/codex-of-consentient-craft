/// <reference lib="dom" />
/**
 * PURPOSE: Opens a database, creating the named object store on upgrade, and self-heals two real
 * corruption shapes rather than failing open. A VERSION MISMATCH — an earlier heal already bumped
 * the on-disk version past the caller's own static `version` — falls back to a version-less open
 * instead of throwing `VersionError` forever. A STORE MISSING at the expected version (deleted by
 * hand, or a decoy database) reopens one version ahead to force `onupgradeneeded` to run again,
 * since IndexedDB only fires that hook on a version increase and a same-version open can never
 * recreate a lost store on its own.
 *
 * USAGE:
 * const db = await openStore({ name: 'chat-composer-drafts', version: 1, storeName: 'drafts' });
 * // Returns an open IDBDatabase with `storeName` guaranteed present
 */

export const openStore = async ({
  name,
  version,
  storeName,
}: {
  name: string;
  version: number;
  storeName: string;
}): Promise<IDBDatabase> => {
  const openedDb = await new Promise<IDBDatabase>((resolve, reject) => {
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
      // A PRIOR heal (the reopen below) can have bumped this database's on-disk version past the
      // caller's own static `version` — a later open requesting that now-stale, LOWER version
      // fails with VersionError rather than attaching at the higher one. Falling back to a
      // version-less open is what makes the heal durable across repeat calls and future sessions.
      if (openRequest.error?.name === 'VersionError') {
        const fallbackRequest = globalThis.indexedDB.open(name);

        fallbackRequest.onupgradeneeded = (): void => {
          const database = fallbackRequest.result;
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { autoIncrement: true });
          }
        };

        fallbackRequest.onsuccess = (): void => {
          resolve(fallbackRequest.result);
        };

        fallbackRequest.onerror = (): void => {
          reject(
            new Error(
              `openStore: failed to open ${name} at its current version — ${fallbackRequest.error?.message ?? 'unknown error'}`,
            ),
          );
        };
        return;
      }

      reject(
        new Error(
          `openStore: failed to open ${name} — ${openRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  // A database that already sits at `version` but lost its store (deleted directly, or created
  // by something other than this app) never gets another chance to run the create-store branch
  // above on a same-version open — reopening one version ahead forces the browser to run the
  // upgrade transaction again, so the missing store heals on the very open that discovers it.
  const needsStoreHeal = !openedDb.objectStoreNames.contains(storeName);
  if (!needsStoreHeal) {
    return openedDb;
  }

  const healVersion = openedDb.version + 1;
  openedDb.close();

  return new Promise<IDBDatabase>((resolve, reject) => {
    const reopenRequest = globalThis.indexedDB.open(name, healVersion);

    reopenRequest.onupgradeneeded = (): void => {
      const database = reopenRequest.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { autoIncrement: true });
      }
    };

    reopenRequest.onsuccess = (): void => {
      resolve(reopenRequest.result);
    };

    reopenRequest.onerror = (): void => {
      reject(
        new Error(
          `openStore: failed to heal missing store on ${name} — ${reopenRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });
};
