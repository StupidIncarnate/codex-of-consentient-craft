/// <reference lib="dom" />
/**
 * PURPOSE: The one in-memory IndexedDB every `indexedDB` proxy hands out, so the `openStore`,
 * `getAll`, `put`, `deleteRecord` and `replaceAll` proxies used in ONE test all read and write the
 * same store per database name and store name. State is scoped to the running test (it resets when
 * jest's current test changes), so nothing leaks between tests and no cleanup call exists. Requests
 * complete on microtasks, and a transaction completes once every request it issued, including ones
 * issued from a success handler, has settled. Failures are staged per operation; nothing fails
 * unless a test asked for it.
 *
 * USAGE:
 * const fake = fakeIndexedDb();
 * fake.seedRecords({ name: 'drafts-db', storeName: 'drafts', records: [first] });
 * const db = fake.buildDb({ name: 'drafts-db' });
 * // ...code under test reads/writes through db...
 * fake.getRecords({ name: 'drafts-db', storeName: 'drafts' }); // the final contents
 */

export type FakeOp = 'getAll' | 'add' | 'put' | 'delete' | 'clear';

export interface FakeFailure {
  message: string;
  ops: readonly FakeOp[];
}

interface FakeStore {
  rows: { key: number; value: unknown }[];
  nextKey: number;
}

export interface FakeTransactionRecord {
  storeNames: readonly string[];
  mode: string;
  ops: FakeOp[];
}

interface FakeWorld {
  testKey: string;
  stores: Map<string, FakeStore>;
  calls: { op: FakeOp; args: unknown[] }[];
  transactions: FakeTransactionRecord[];
}

interface FakeRequest {
  result: unknown;
  error: { message: string } | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

interface FakeTransaction {
  error: { message: string } | null;
  oncomplete: (() => void) | null;
  onerror: (() => void) | null;
  abort: () => void;
  objectStore: (storeName: string) => unknown;
}

interface FakeTransactionState {
  pending: number;
  failed: boolean;
  done: boolean;
}

const holder: { world: FakeWorld | undefined } = { world: undefined };

export const fakeIndexedDb = (): {
  seedRecords: (params: { name: string; storeName: string; records: readonly unknown[] }) => void;
  getRecords: (params: { name: string; storeName: string }) => unknown[];
  buildDb: (params: {
    name: string;
    version?: number;
    hasStore?: () => boolean;
    createStore?: () => void;
    failure?: FakeFailure;
  }) => IDBDatabase;
  getCalls: (params: { op: FakeOp }) => readonly unknown[][];
  getTransactions: () => readonly FakeTransactionRecord[];
} => {
  const engine = {
    world: (): FakeWorld => {
      const { testPath, currentTestName } = expect.getState();
      const testKey = `${testPath ?? ''}::${currentTestName ?? ''}`;
      if (holder.world?.testKey === testKey) {
        return holder.world;
      }
      const fresh: FakeWorld = { testKey, stores: new Map(), calls: [], transactions: [] };
      holder.world = fresh;
      return fresh;
    },
    store: ({ name, storeName }: { name: string; storeName: string }): FakeStore => {
      const { stores } = engine.world();
      const key = `${name}\u0000${storeName}`;
      const existing = stores.get(key);
      if (existing) {
        return existing;
      }
      const created: FakeStore = { rows: [], nextKey: 1 };
      stores.set(key, created);
      return created;
    },
    append: ({ store, value }: { store: FakeStore; value: unknown }): number => {
      const key = store.nextKey;
      store.nextKey += 1;
      store.rows.push({ key, value });
      return key;
    },
    // Mutations run at call time so their order is the call order; the request's callbacks fire on
    // a microtask, after the caller has assigned them.
    issue: ({
      transaction,
      record,
      state,
      failure,
      op,
      args,
      exec,
    }: {
      transaction: FakeTransaction;
      record: FakeTransactionRecord;
      state: FakeTransactionState;
      failure: FakeFailure | null;
      op: FakeOp;
      args: unknown[];
      exec: () => unknown;
    }): FakeRequest => {
      record.ops.push(op);
      engine.world().calls.push({ op, args });
      state.pending += 1;
      const failing = failure?.ops.includes(op) === true;
      const outcome = failing ? undefined : exec();
      const request: FakeRequest = {
        result: undefined,
        error: null,
        onsuccess: null,
        onerror: null,
      };

      queueMicrotask((): void => {
        if (failing) {
          request.error = { message: failure.message };
          transaction.error = request.error;
          state.failed = true;
          request.onerror?.();
          transaction.onerror?.();
          state.pending -= 1;
          return;
        }
        request.result = outcome;
        request.onsuccess?.();
        state.pending -= 1;
        queueMicrotask((): void => {
          if (state.pending === 0 && !state.failed && !state.done) {
            state.done = true;
            transaction.oncomplete?.();
          }
        });
      });

      return request;
    },
    transaction: ({
      name,
      storeNames,
      mode,
      failure,
    }: {
      name: string;
      storeNames: readonly string[];
      mode: string;
      failure: FakeFailure | null;
    }): FakeTransaction => {
      const record: FakeTransactionRecord = { storeNames, mode, ops: [] };
      engine.world().transactions.push(record);
      const state: FakeTransactionState = { pending: 0, failed: false, done: false };

      const transaction: FakeTransaction = {
        error: null,
        oncomplete: null,
        onerror: null,
        abort: (): void => {
          state.failed = true;
        },
        objectStore: (storeName: string): unknown => {
          const store = engine.store({ name, storeName });
          const base = { transaction, record, state, failure };

          return {
            getAll: (): FakeRequest =>
              engine.issue({
                ...base,
                op: 'getAll',
                args: [storeName],
                exec: (): unknown[] => store.rows.map((row) => row.value),
              }),
            add: (value: unknown): FakeRequest =>
              engine.issue({
                ...base,
                op: 'add',
                args: [storeName, value],
                exec: (): number => engine.append({ store, value }),
              }),
            put: (value: unknown): FakeRequest =>
              engine.issue({
                ...base,
                op: 'put',
                args: [storeName, value],
                exec: (): number => engine.append({ store, value }),
              }),
            delete: (key: IDBValidKey): FakeRequest =>
              engine.issue({
                ...base,
                op: 'delete',
                args: [storeName, key],
                exec: (): undefined => {
                  store.rows = store.rows.filter((row) => row.key !== key);
                  return undefined;
                },
              }),
            clear: (): FakeRequest =>
              engine.issue({
                ...base,
                op: 'clear',
                args: [storeName],
                exec: (): undefined => {
                  store.rows = [];
                  return undefined;
                },
              }),
          };
        },
      };

      return transaction;
    },
  };

  return {
    seedRecords: ({ name, storeName, records }): void => {
      const store = engine.store({ name, storeName });
      store.rows = [];
      for (const value of records) {
        engine.append({ store, value });
      }
    },
    getRecords: ({ name, storeName }): unknown[] =>
      engine.store({ name, storeName }).rows.map((row) => row.value),
    buildDb: ({ name, version = 1, hasStore, createStore, failure }): IDBDatabase =>
      ({
        version,
        objectStoreNames: { contains: (): boolean => (hasStore ? hasStore() : true) },
        createObjectStore: (): void => {
          createStore?.();
        },
        close: (): void => undefined,
        transaction: (storeNames: string[], mode = 'readonly'): unknown =>
          engine.transaction({ name, storeNames, mode, failure: failure ?? null }),
      }) as unknown as IDBDatabase,
    getCalls: ({ op }): readonly unknown[][] =>
      engine
        .world()
        .calls.filter((call) => call.op === op)
        .map((call) => call.args),
    getTransactions: (): readonly FakeTransactionRecord[] => engine.world().transactions,
  };
};
