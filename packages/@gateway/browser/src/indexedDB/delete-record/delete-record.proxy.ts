/// <reference lib="dom" />
import { fakeIndexedDb } from '../../gateway-test-support/fake-indexed-db';

// Every indexedDB proxy in one test shares the fake's store for a database name and store name, so
// records seeded here are what `openStore`, `getAll`, `put`, `deleteRecord` and `replaceAll` all see.
// A store nobody seeded is empty, as a fresh store is; nothing is staged by default.
export const deleteRecordProxy = (): {
  seedRecords: (params: { name: string; storeName: string; records: readonly unknown[] }) => void;
  getRecords: (params: { name: string; storeName: string }) => unknown[];
  buildDb: (params: { name: string }) => IDBDatabase;
  buildFailingDb: (params: { name: string; errorMessage: string }) => IDBDatabase;
  getCallsFor: () => readonly unknown[][];
} => {
  const fake = fakeIndexedDb();

  return {
    seedRecords: fake.seedRecords,
    getRecords: fake.getRecords,
    buildDb: ({ name }: { name: string }): IDBDatabase => fake.buildDb({ name }),
    buildFailingDb: ({ name, errorMessage }: { name: string; errorMessage: string }): IDBDatabase =>
      fake.buildDb({ name, failure: { message: errorMessage, ops: ['delete'] } }),
    // [storeName, key] per delete() request issued
    getCallsFor: (): readonly unknown[][] => fake.getCalls({ op: 'delete' }),
  };
};
