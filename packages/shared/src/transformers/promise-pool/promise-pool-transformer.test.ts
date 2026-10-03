import { promisePoolTransformer } from './promise-pool-transformer';

const createDeferred = <T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} => {
  let resolveHandler: ((value: T) => void) | null = null;
  let rejectHandler: ((reason?: unknown) => void) | null = null;
  const promise = new Promise<T>((res, rej) => {
    resolveHandler = res;
    rejectHandler = rej;
  });
  return {
    promise,
    resolve: (value: T): void => {
      resolveHandler?.(value);
    },
    reject: (reason?: unknown): void => {
      rejectHandler?.(reason);
    },
  };
};

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('promisePoolTransformer', () => {
  describe('worker reuse on early completion', () => {
    it('VALID: {concurrency: 2, items: [long, short, short, short]} => worker that ran first short runs third and fourth while long is pending', async () => {
      const started: string[] = [];

      const deferreds = new Map<string, ReturnType<typeof createDeferred<string>>>();
      deferreds.set('long', createDeferred<string>());
      deferreds.set('short-1', createDeferred<string>());
      deferreds.set('short-2', createDeferred<string>());
      deferreds.set('short-3', createDeferred<string>());

      const items = ['long', 'short-1', 'short-2', 'short-3'];

      const handler = async (item: string): Promise<string> => {
        started.push(item);
        return deferreds.get(item)!.promise;
      };

      const poolPromise = promisePoolTransformer({
        items,
        concurrency: 2,
        handler,
      });

      expect(started).toStrictEqual(['long', 'short-1']);

      deferreds.get('short-1')!.resolve('done-short-1');
      await flushPromises();

      expect(started).toStrictEqual(['long', 'short-1', 'short-2']);

      deferreds.get('short-2')!.resolve('done-short-2');
      await flushPromises();

      expect(started).toStrictEqual(['long', 'short-1', 'short-2', 'short-3']);

      deferreds.get('short-3')!.resolve('done-short-3');
      deferreds.get('long')!.resolve('done-long');

      const results = await poolPromise;

      expect(results).toStrictEqual(['done-long', 'done-short-1', 'done-short-2', 'done-short-3']);
    });
  });

  describe('concurrency limiting', () => {
    it('VALID: {concurrency: 2, 4 items} => active handlers in flight never exceed concurrency', async () => {
      let activeCount = 0;
      let maxActiveCount = 0;

      const deferreds = new Map<string, ReturnType<typeof createDeferred<number>>>();
      deferreds.set('item1', createDeferred<number>());
      deferreds.set('item2', createDeferred<number>());
      deferreds.set('item3', createDeferred<number>());
      deferreds.set('item4', createDeferred<number>());

      const items = ['item1', 'item2', 'item3', 'item4'];

      const handler = async (item: string): Promise<number> => {
        activeCount += 1;
        maxActiveCount = Math.max(maxActiveCount, activeCount);
        const result = await deferreds.get(item)!.promise;
        activeCount -= 1;
        return result;
      };

      const poolPromise = promisePoolTransformer({
        items,
        concurrency: 2,
        handler,
      });

      expect(activeCount).toBe(2);

      deferreds.get('item1')!.resolve(10);
      await flushPromises();

      deferreds.get('item2')!.resolve(20);
      await flushPromises();

      deferreds.get('item3')!.resolve(30);
      await flushPromises();

      deferreds.get('item4')!.resolve(40);

      const results = await poolPromise;

      expect(activeCount).toBe(0);
      expect(maxActiveCount).toBe(2);
      expect(results).toStrictEqual([10, 20, 30, 40]);
    });
  });

  describe('result ordering', () => {
    it('VALID: {items completing out of order} => returns results in input order', async () => {
      const deferreds = new Map<string, ReturnType<typeof createDeferred<string>>>();
      deferreds.set('first', createDeferred<string>());
      deferreds.set('second', createDeferred<string>());
      deferreds.set('third', createDeferred<string>());

      const items = ['first', 'second', 'third'];

      const handler = async (item: string): Promise<string> => deferreds.get(item)!.promise;

      const poolPromise = promisePoolTransformer({
        items,
        concurrency: 3,
        handler,
      });

      deferreds.get('third')!.resolve('done-third');
      deferreds.get('first')!.resolve('done-first');
      deferreds.get('second')!.resolve('done-second');

      const results = await poolPromise;

      expect(results).toStrictEqual(['done-first', 'done-second', 'done-third']);
    });
  });

  describe('boundary item counts', () => {
    it('EDGE: {concurrency: 5, 2 items} => processes items when concurrency exceeds item count', async () => {
      const deferreds = new Map<string, ReturnType<typeof createDeferred<string>>>();
      deferreds.set('item1', createDeferred<string>());
      deferreds.set('item2', createDeferred<string>());

      const items = ['item1', 'item2'];

      const handler = async (item: string): Promise<string> => deferreds.get(item)!.promise;

      const poolPromise = promisePoolTransformer({
        items,
        concurrency: 5,
        handler,
      });

      deferreds.get('item1')!.resolve('done-1');
      deferreds.get('item2')!.resolve('done-2');

      const results = await poolPromise;

      expect(results).toStrictEqual(['done-1', 'done-2']);
    });

    it('EMPTY: {items: []} => returns empty array without calling handler', async () => {
      let callCount = 0;
      const handler = async (item: string): Promise<string> => {
        await Promise.resolve();
        callCount += 1;
        return item;
      };

      const results = await promisePoolTransformer({
        items: [] as string[],
        concurrency: 3,
        handler,
      });

      expect(callCount).toBe(0);
      expect(results).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {handler rejects} => rejects the pool call with handler error', async () => {
      const deferreds = new Map<string, ReturnType<typeof createDeferred<string>>>();
      deferreds.set('failing', createDeferred<string>());
      deferreds.set('succeeding', createDeferred<string>());

      const items = ['failing', 'succeeding'];

      const handler = async (item: string): Promise<string> => deferreds.get(item)!.promise;

      const poolPromise = promisePoolTransformer({
        items,
        concurrency: 2,
        handler,
      });

      deferreds.get('failing')!.reject(new Error('handler-failed'));
      deferreds.get('succeeding')!.resolve('done-succeeding');

      await expect(poolPromise).rejects.toThrow('handler-failed');
    });
  });

  describe('dynamic limit', () => {
    it('VALID: {limit drops from 3 to 1 mid-run} => completes in-flight items then runs one at a time', async () => {
      let currentLimit = 3;
      const started: string[] = [];

      const deferreds = new Map<string, ReturnType<typeof createDeferred<string>>>();
      deferreds.set('item-0', createDeferred<string>());
      deferreds.set('item-1', createDeferred<string>());
      deferreds.set('item-2', createDeferred<string>());
      deferreds.set('item-3', createDeferred<string>());
      deferreds.set('item-4', createDeferred<string>());

      const items = ['item-0', 'item-1', 'item-2', 'item-3', 'item-4'];

      const handler = async (item: string): Promise<string> => {
        started.push(item);
        return deferreds.get(item)!.promise;
      };

      const limit = async (): Promise<number> => {
        await Promise.resolve();
        return currentLimit;
      };

      const poolPromise = promisePoolTransformer({
        items,
        handler,
        limit,
      });

      await flushPromises();

      expect(started).toStrictEqual(['item-0', 'item-1', 'item-2']);

      currentLimit = 1;

      deferreds.get('item-0')!.resolve('done-0');
      await flushPromises();

      expect(started).toStrictEqual(['item-0', 'item-1', 'item-2']);

      deferreds.get('item-1')!.resolve('done-1');
      deferreds.get('item-2')!.resolve('done-2');
      await flushPromises();

      expect(started).toStrictEqual(['item-0', 'item-1', 'item-2', 'item-3']);

      deferreds.get('item-3')!.resolve('done-3');
      await flushPromises();

      expect(started).toStrictEqual(['item-0', 'item-1', 'item-2', 'item-3', 'item-4']);

      deferreds.get('item-4')!.resolve('done-4');

      const results = await poolPromise;

      expect(results).toStrictEqual(['done-0', 'done-1', 'done-2', 'done-3', 'done-4']);
    });

    it('EDGE: {limit returns 0} => runs one at a time', async () => {
      const started: string[] = [];

      const deferreds = new Map<string, ReturnType<typeof createDeferred<string>>>();
      deferreds.set('item-0', createDeferred<string>());
      deferreds.set('item-1', createDeferred<string>());
      deferreds.set('item-2', createDeferred<string>());

      const items = ['item-0', 'item-1', 'item-2'];

      const handler = async (item: string): Promise<string> => {
        started.push(item);
        return deferreds.get(item)!.promise;
      };

      const limit = async (): Promise<number> => {
        await Promise.resolve();
        return 0;
      };

      const poolPromise = promisePoolTransformer({
        items,
        handler,
        limit,
      });

      await flushPromises();

      expect(started).toStrictEqual(['item-0']);

      deferreds.get('item-0')!.resolve('done-0');
      await flushPromises();

      expect(started).toStrictEqual(['item-0', 'item-1']);

      deferreds.get('item-1')!.resolve('done-1');
      await flushPromises();

      expect(started).toStrictEqual(['item-0', 'item-1', 'item-2']);

      deferreds.get('item-2')!.resolve('done-2');

      const results = await poolPromise;

      expect(results).toStrictEqual(['done-0', 'done-1', 'done-2']);
    });

    it('VALID: {limit rises mid-run} => lets more items start at next completion', async () => {
      let currentLimit = 1;
      const started: string[] = [];

      const deferreds = new Map<string, ReturnType<typeof createDeferred<string>>>();
      deferreds.set('item-0', createDeferred<string>());
      deferreds.set('item-1', createDeferred<string>());
      deferreds.set('item-2', createDeferred<string>());
      deferreds.set('item-3', createDeferred<string>());
      deferreds.set('item-4', createDeferred<string>());

      const items = ['item-0', 'item-1', 'item-2', 'item-3', 'item-4'];

      const handler = async (item: string): Promise<string> => {
        started.push(item);
        return deferreds.get(item)!.promise;
      };

      const limit = async (): Promise<number> => {
        await Promise.resolve();
        return currentLimit;
      };

      const poolPromise = promisePoolTransformer({
        items,
        handler,
        limit,
      });

      await flushPromises();

      expect(started).toStrictEqual(['item-0']);

      currentLimit = 3;

      deferreds.get('item-0')!.resolve('done-0');
      await flushPromises();

      expect(started).toStrictEqual(['item-0', 'item-1', 'item-2', 'item-3']);

      deferreds.get('item-1')!.resolve('done-1');
      await flushPromises();

      expect(started).toStrictEqual(['item-0', 'item-1', 'item-2', 'item-3', 'item-4']);

      deferreds.get('item-2')!.resolve('done-2');
      deferreds.get('item-3')!.resolve('done-3');
      deferreds.get('item-4')!.resolve('done-4');

      const results = await poolPromise;

      expect(results).toStrictEqual(['done-0', 'done-1', 'done-2', 'done-3', 'done-4']);
    });

    it('ERROR: {handler rejects with limit} => rejects the pool call with handler error', async () => {
      const deferreds = new Map<string, ReturnType<typeof createDeferred<string>>>();
      deferreds.set('failing', createDeferred<string>());
      deferreds.set('succeeding', createDeferred<string>());

      const items = ['failing', 'succeeding'];

      const handler = async (item: string): Promise<string> => deferreds.get(item)!.promise;
      const limit = async (): Promise<number> => {
        await Promise.resolve();
        return 2;
      };

      const poolPromise = promisePoolTransformer({
        items,
        handler,
        limit,
      });

      deferreds.get('failing')!.reject(new Error('handler-failed'));
      deferreds.get('succeeding')!.resolve('done-succeeding');

      await expect(poolPromise).rejects.toThrow('handler-failed');
    });

    it('ERROR: {limit rejects} => rejects the pool call with limit error', async () => {
      const items = ['item-0', 'item-1'];
      const handler = async (item: string): Promise<string> => {
        await Promise.resolve();
        return item;
      };
      const limit = async (): Promise<number> => {
        await Promise.resolve();
        throw new Error('limit-failed');
      };

      const poolPromise = promisePoolTransformer({
        items,
        handler,
        limit,
      });

      await expect(poolPromise).rejects.toThrow('limit-failed');
    });

    it('EMPTY: {items: [], limit} => returns empty array without calling handler or limit', async () => {
      let handlerCalled = 0;
      let limitCalled = 0;

      const results = await promisePoolTransformer({
        items: [] as string[],
        handler: async (item: string): Promise<string> => {
          await Promise.resolve();
          handlerCalled += 1;
          return item;
        },
        limit: async (): Promise<number> => {
          await Promise.resolve();
          limitCalled += 1;
          return 2;
        },
      });

      expect(handlerCalled).toBe(0);
      expect(limitCalled).toBe(0);
      expect(results).toStrictEqual([]);
    });

    it('VALID: {concurrency omitted} => defaults concurrency to 4', async () => {
      let activeCount = 0;
      let maxActiveCount = 0;

      const deferreds = new Map<string, ReturnType<typeof createDeferred<number>>>();
      deferreds.set('item1', createDeferred<number>());
      deferreds.set('item2', createDeferred<number>());
      deferreds.set('item3', createDeferred<number>());
      deferreds.set('item4', createDeferred<number>());
      deferreds.set('item5', createDeferred<number>());

      const items = ['item1', 'item2', 'item3', 'item4', 'item5'];

      const handler = async (item: string): Promise<number> => {
        activeCount += 1;
        maxActiveCount = Math.max(maxActiveCount, activeCount);
        const result = await deferreds.get(item)!.promise;
        activeCount -= 1;
        return result;
      };

      const poolPromise = promisePoolTransformer({
        items,
        handler,
      });

      expect(activeCount).toBe(4);

      deferreds.get('item1')!.resolve(10);
      await flushPromises();

      expect(activeCount).toBe(4);
      expect(maxActiveCount).toBe(4);

      deferreds.get('item2')!.resolve(20);
      deferreds.get('item3')!.resolve(30);
      deferreds.get('item4')!.resolve(40);
      deferreds.get('item5')!.resolve(50);

      const results = await poolPromise;

      expect(activeCount).toBe(0);
      expect(results).toStrictEqual([10, 20, 30, 40, 50]);
    });
  });
});
