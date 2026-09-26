/// <reference lib="dom" />
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

interface FakeOpenRequest {
  result: unknown;
  error: { name: string; message: string } | null;
  onupgradeneeded: (() => void) | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

export const openStoreProxy = (): {
  seedExistingDatabase: (params: { name: string; version: number }) => void;
  seedDatabaseMissingStore: (params: { name: string; version: number }) => void;
  seedStaleVersionRequest: (params: { name: string; version: number }) => void;
  seedOpenRefused: (params: { name: string; version: number; message: string }) => void;
} => {
  // jsdom does not implement `indexedDB` by default — attach a real method to spy on. Re-typed to
  // an optional shape first because globalThis.indexedDB is declared non-nullable by lib.dom,
  // which leaves the existence check below nothing to narrow.
  const globalIndexedDb = globalThis as { indexedDB?: IDBFactory };
  if (!globalIndexedDb.indexedDB) {
    Object.defineProperty(globalThis, 'indexedDB', {
      value: { open: (): unknown => undefined },
      configurable: true,
      writable: true,
    });
  }

  const handle: SpyOnHandle = registerSpyOn({ object: globalThis.indexedDB, method: 'open' });

  const state: { table: unknown[]; storeCreated: boolean } = { table: [], storeCreated: false };

  const buildOpenedDatabase = ({ version }: { version: number }): unknown => ({
    version,
    objectStoreNames: { contains: (): boolean => state.storeCreated },
    createObjectStore: (): void => {
      state.storeCreated = true;
    },
    close: (): void => undefined,
  });

  return {
    // A caller opening at the version it already holds, with the store present — resolves
    // straight through, no heal.
    seedExistingDatabase: ({ name, version }: { name: string; version: number }): void => {
      state.storeCreated = true;
      handle.calledWith([name, version]).implement((): FakeOpenRequest => {
        const request: FakeOpenRequest = {
          result: undefined,
          error: null,
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
        };
        queueMicrotask((): void => {
          request.result = buildOpenedDatabase({ version });
          request.onsuccess?.();
        });
        return request;
      });
    },

    // A database at the expected version but missing the store — the first open resolves with
    // the store absent, which forces openStore to reopen one version ahead; that reopen request
    // is answered by running onupgradeneeded (creating the store) for real.
    seedDatabaseMissingStore: ({ name, version }: { name: string; version: number }): void => {
      state.storeCreated = false;
      handle.calledWith([name, version]).implement((): FakeOpenRequest => {
        const request: FakeOpenRequest = {
          result: undefined,
          error: null,
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
        };
        queueMicrotask((): void => {
          request.result = buildOpenedDatabase({ version });
          request.onsuccess?.();
        });
        return request;
      });

      handle.calledWith([name, version + 1]).implement((): FakeOpenRequest => {
        const request: FakeOpenRequest = {
          result: undefined,
          error: null,
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
        };
        queueMicrotask((): void => {
          request.result = buildOpenedDatabase({ version: version + 1 });
          request.onupgradeneeded?.();
          request.onsuccess?.();
        });
        return request;
      });
    },

    // The requested version is now stale (a prior heal bumped the real on-disk version past it) —
    // the versioned open fails VersionError, and the version-less fallback succeeds with the
    // store already present.
    seedStaleVersionRequest: ({ name, version }: { name: string; version: number }): void => {
      state.storeCreated = true;
      handle.calledWith([name, version]).implement((): FakeOpenRequest => {
        const request: FakeOpenRequest = {
          result: undefined,
          error: null,
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
        };
        queueMicrotask((): void => {
          request.error = { name: 'VersionError', message: 'requested version is lower' };
          request.onerror?.();
        });
        return request;
      });

      handle.calledWith([name]).implement((): FakeOpenRequest => {
        const request: FakeOpenRequest = {
          result: undefined,
          error: null,
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
        };
        queueMicrotask((): void => {
          request.result = buildOpenedDatabase({ version: version + 1 });
          request.onsuccess?.();
        });
        return request;
      });
    },

    seedOpenRefused: ({
      name,
      version,
      message,
    }: {
      name: string;
      version: number;
      message: string;
    }): void => {
      handle.calledWith([name, version]).implement((): FakeOpenRequest => {
        const request: FakeOpenRequest = {
          result: undefined,
          error: null,
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
        };
        queueMicrotask((): void => {
          request.error = { name: 'UnknownError', message };
          request.onerror?.();
        });
        return request;
      });
    },
  };
};
