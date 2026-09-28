import { fakeIndexedDb } from './fake-indexed-db';

describe('fakeIndexedDb', () => {
  it('VALID: {records seeded} => getRecords reads them back in insertion order', () => {
    const fake = fakeIndexedDb();
    fake.seedRecords({ name: 'db', storeName: 'store', records: ['a', 'b'] });

    expect(fake.getRecords({ name: 'db', storeName: 'store' })).toStrictEqual(['a', 'b']);
  });

  it('VALID: {two fakeIndexedDb() handles in one test} => both see one store', () => {
    const writer = fakeIndexedDb();
    const reader = fakeIndexedDb();
    writer.seedRecords({ name: 'db', storeName: 'store', records: ['shared'] });

    expect(reader.getRecords({ name: 'db', storeName: 'store' })).toStrictEqual(['shared']);
  });

  it('VALID: {seeded in this test, first of an isolation pair} => the store holds the seed', () => {
    const fake = fakeIndexedDb();
    fake.seedRecords({ name: 'iso-db', storeName: 'store', records: ['leaky'] });

    expect(fake.getRecords({ name: 'iso-db', storeName: 'store' })).toStrictEqual(['leaky']);
  });

  it('EMPTY: {second of an isolation pair} => the previous test seed is gone', () => {
    const fake = fakeIndexedDb();

    expect(fake.getRecords({ name: 'iso-db', storeName: 'store' })).toStrictEqual([]);
  });

  it('VALID: {transaction over a database} => operations run in call order and complete once', async () => {
    const fake = fakeIndexedDb();
    const db = fake.buildDb({ name: 'db' });
    const transaction = db.transaction(['store'], 'readwrite');
    const store = transaction.objectStore('store');
    const completions: string[] = [];
    transaction.oncomplete = (): void => {
      completions.push('complete');
    };

    store.add('one');
    store.add('two');
    store.delete(1);
    await new Promise<void>((resolve) => {
      transaction.oncomplete = (): void => {
        completions.push('complete');
        resolve();
      };
    });

    expect({
      records: fake.getRecords({ name: 'db', storeName: 'store' }),
      completions,
      transactions: fake.getTransactions(),
    }).toStrictEqual({
      records: ['two'],
      completions: ['complete'],
      transactions: [{ storeNames: ['store'], mode: 'readwrite', ops: ['add', 'add', 'delete'] }],
    });
  });

  it('ERROR: {failure staged for add} => the request error and the transaction error both fire', async () => {
    const fake = fakeIndexedDb();
    const db = fake.buildDb({ name: 'db', failure: { message: 'full', ops: ['add'] } });
    const transaction = db.transaction(['store'], 'readwrite');
    const request = transaction.objectStore('store').add('x');
    const events: string[] = [];

    await new Promise<void>((resolve) => {
      request.onerror = (): void => {
        events.push(`request:${JSON.stringify(request.error)}`);
      };
      transaction.onerror = (): void => {
        events.push(`transaction:${JSON.stringify(transaction.error)}`);
        resolve();
      };
    });

    expect({ events, records: fake.getRecords({ name: 'db', storeName: 'store' }) }).toStrictEqual({
      events: ['request:{"message":"full"}', 'transaction:{"message":"full"}'],
      records: [],
    });
  });

  it('VALID: {getCalls for an op} => reads back the arguments of each request of that op', () => {
    const fake = fakeIndexedDb();
    const db = fake.buildDb({ name: 'db' });
    const store = db.transaction(['store'], 'readwrite').objectStore('store');

    store.put('p');
    store.delete(5);

    expect(fake.getCalls({ op: 'put' })).toStrictEqual([['store', 'p']]);
  });

  it('VALID: {createStore and hasStore given} => the database reports and creates the store through them', () => {
    const fake = fakeIndexedDb();
    const state = { created: false };
    const db = fake.buildDb({
      name: 'db',
      version: 3,
      hasStore: (): boolean => state.created,
      createStore: (): void => {
        state.created = true;
      },
    });

    const before = db.objectStoreNames.contains('store');
    db.createObjectStore('store');

    expect({
      before,
      after: db.objectStoreNames.contains('store'),
      version: db.version,
    }).toStrictEqual({
      before: false,
      after: true,
      version: 3,
    });
  });

  it('VALID: {abort on a transaction} => it never completes', async () => {
    const fake = fakeIndexedDb();
    const db = fake.buildDb({ name: 'db' });
    const transaction = db.transaction(['store'], 'readwrite');
    const completions: string[] = [];
    transaction.oncomplete = (): void => {
      completions.push('complete');
    };

    transaction.objectStore('store').add('x');
    transaction.abort();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(completions).toStrictEqual([]);
  });
});
