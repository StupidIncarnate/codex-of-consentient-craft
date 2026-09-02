import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

interface FakeIndexedDbRequest {
  result: unknown;
  error: unknown;
  onupgradeneeded: (() => void) | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

interface FakeIndexedDbTransaction {
  objectStore: () => {
    clear: () => unknown;
    add: (value: unknown) => unknown;
  };
  oncomplete: (() => void) | null;
  onerror: (() => void) | null;
}

export const indexedDbDraftImagesReplaceAdapterProxy = (): {
  seed: (params: { drafts: readonly unknown[] }) => void;
  getStoredDrafts: () => readonly unknown[];
  openFails: (params: { error: Error }) => void;
} => {
  const { name, version } = chatComposerStatics.draftDatabase;

  // Backs the fake object store as a plain array rather than a keyed table: autoIncrement's only
  // observable effect here is that getAll() returns records in the order they were added, and a
  // JS array already preserves insertion order without needing a key counter.
  const state: {
    table: unknown[];
    storeCreated: boolean;
    failOpenWith: Error | null;
  } = {
    table: [],
    storeCreated: false,
    failOpenWith: null,
  };

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

  // Models just the request/transaction event surface the replace adapter actually touches —
  // open → upgradeneeded → a readwrite transaction's objectStore().clear()/.add() — not the whole
  // IndexedDB API. Real IndexedDB events are asynchronous, so firing is deferred to a microtask:
  // that gives the adapter code a chance to assign onupgradeneeded/onsuccess/oncomplete (which it
  // does synchronously right after each call returns) before this proxy invokes them.
  handle.calledWith([name, version]).implement((): FakeIndexedDbRequest => {
    const request: FakeIndexedDbRequest = {
      result: undefined,
      error: null,
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
    };

    queueMicrotask((): void => {
      if (state.failOpenWith) {
        request.error = state.failOpenWith;
        request.onerror?.();
        return;
      }

      request.result = {
        objectStoreNames: { contains: (): boolean => state.storeCreated },
        createObjectStore: (): void => {
          state.storeCreated = true;
        },
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
            }),
            oncomplete: null,
            onerror: null,
          };

          // Scheduled now, read later: by the time this fires, the adapter has already run
          // clear()/add() and assigned oncomplete synchronously, in the same turn that called
          // transaction().
          queueMicrotask((): void => {
            transaction.oncomplete?.();
          });

          return transaction;
        },
      };

      request.onupgradeneeded?.();
      request.onsuccess?.();
    });

    return request;
  });

  return {
    seed: ({ drafts }: { drafts: readonly unknown[] }): void => {
      state.storeCreated = true;
      for (const draft of drafts) {
        state.table.push(draft);
      }
    },
    getStoredDrafts: (): readonly unknown[] => [...state.table],
    openFails: ({ error }: { error: Error }): void => {
      state.failOpenWith = error;
    },
  };
};
