import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

interface FakeIndexedDbGetAllRequest {
  result: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

interface FakeIndexedDbTransaction {
  objectStore: () => {
    clear: () => unknown;
    add: (value: unknown) => unknown;
    getAll: () => FakeIndexedDbGetAllRequest;
  };
  oncomplete: (() => void) | null;
  onerror: (() => void) | null;
}

interface FakeIndexedDbRequest {
  result: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

// This layer receives an ALREADY-OPEN IDBDatabase (the parent adapter's own open/heal already
// ran) — it never calls indexedDB.open itself in production, so this proxy only has to fake the
// transaction/objectStore surface a caller uses AFTER opening, not the open request too. Own fake
// rather than composing indexedDbDraftImagesReadAdapterProxy's: that proxy imports THIS layer's
// proxy already (enforce-proxy-child-creation, since the read adapter imports this layer), and a
// proxy importing back the other way would be circular.
export const migrateLegacyRecordsLayerAdapterProxy = (): {
  // The layer's own tests build the `db` argument themselves — this is what that open resolves
  // against, once this fake's indexedDB.open is in place.
  openDb: () => Promise<IDBDatabase>;
  seed: (params: { drafts: readonly unknown[] }) => void;
  getStoredDrafts: () => readonly unknown[];
} => {
  const { name, version } = chatComposerStatics.draftDatabase;

  const state: { table: unknown[] } = { table: [] };

  // jsdom does not implement `indexedDB` by default (see clipboard-write-adapter.proxy.ts for the
  // same shape of workaround), so attach a real method to spy on. Re-typed to an optional shape
  // first because globalThis.indexedDB is declared non-nullable by lib.dom — without this, the
  // existence check below has nothing to narrow.
  const globalIndexedDb = globalThis as { indexedDB?: IDBFactory };
  if (!globalIndexedDb.indexedDB) {
    Object.defineProperty(globalThis, 'indexedDB', {
      value: { open: (): unknown => undefined },
      configurable: true,
      writable: true,
    });
  }

  const handle: SpyOnHandle = registerSpyOn({ object: globalThis.indexedDB, method: 'open' });

  handle.calledWith([name, version]).implement((): FakeIndexedDbRequest => {
    const request: FakeIndexedDbRequest = { result: undefined, onsuccess: null, onerror: null };

    queueMicrotask((): void => {
      request.result = {
        close: (): void => undefined,
        transaction: (): FakeIndexedDbTransaction => {
          const transaction: FakeIndexedDbTransaction = {
            objectStore: () => ({
              clear: (): unknown => {
                state.table.length = 0;
                return {};
              },
              add: (value: unknown): unknown => {
                state.table.push(value);
                return {};
              },
              getAll: (): FakeIndexedDbGetAllRequest => {
                const getAllRequest: FakeIndexedDbGetAllRequest = {
                  result: undefined,
                  onsuccess: null,
                  onerror: null,
                };

                queueMicrotask((): void => {
                  getAllRequest.result = [...state.table];
                  getAllRequest.onsuccess?.();
                });

                return getAllRequest;
              },
            }),
            oncomplete: null,
            onerror: null,
          };

          queueMicrotask((): void => {
            queueMicrotask((): void => {
              transaction.oncomplete?.();
            });
          });

          return transaction;
        },
      };

      request.onsuccess?.();
    });

    return request;
  });

  return {
    openDb: async (): Promise<IDBDatabase> =>
      new Promise((resolve, reject) => {
        const request = globalThis.indexedDB.open(name, version);
        request.onsuccess = (): void => {
          resolve(request.result);
        };
        request.onerror = (): void => {
          reject(request.error ?? new Error('migrateLegacyRecordsLayerAdapterProxy: open failed'));
        };
      }),
    seed: ({ drafts }: { drafts: readonly unknown[] }): void => {
      for (const draft of drafts) {
        state.table.push(draft);
      }
    },
    getStoredDrafts: (): readonly unknown[] => [...state.table],
  };
};
