/// <reference lib="dom" />
import { fakeIndexedDb } from '../../gateway-test-support/fake-indexed-db';

// Shares the fake's store with every other indexedDB proxy in the test, per database name and store
// name. `getTransactionsFor` reads back each transaction opened: its stores, its mode and the
// operations it issued in order, which is how a test proves the rewrite was ONE transaction.
export const replaceAllProxy = (): {
  seedRecords: (params: { name: string; storeName: string; records: readonly unknown[] }) => void;
  getRecords: (params: { name: string; storeName: string }) => unknown[];
  buildDb: (params: { name: string }) => IDBDatabase;
  buildFailingDb: (params: {
    name: string;
    errorMessage: string;
    failOn: 'read' | 'write';
  }) => IDBDatabase;
  getTransactionsFor: () => readonly {
    storeNames: readonly string[];
    mode: string;
    ops: readonly string[];
  }[];
} => {
  const fake = fakeIndexedDb();

  return {
    seedRecords: fake.seedRecords,
    getRecords: fake.getRecords,
    buildDb: ({ name }: { name: string }): IDBDatabase => fake.buildDb({ name }),
    buildFailingDb: ({
      name,
      errorMessage,
      failOn,
    }: {
      name: string;
      errorMessage: string;
      failOn: 'read' | 'write';
    }): IDBDatabase =>
      fake.buildDb({
        name,
        failure: {
          message: errorMessage,
          ops: failOn === 'read' ? ['getAll'] : ['clear', 'add'],
        },
      }),
    getTransactionsFor: (): readonly {
      storeNames: readonly string[];
      mode: string;
      ops: readonly string[];
    }[] => fake.getTransactions(),
  };
};
