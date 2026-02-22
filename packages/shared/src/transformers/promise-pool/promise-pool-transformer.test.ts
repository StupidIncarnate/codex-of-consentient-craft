import { ArrayIndexStub } from '../../contracts/array-index/array-index.stub';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

import { promisePoolTransformer } from './promise-pool-transformer';

describe('promisePoolTransformer', () => {
  describe('result ordering', () => {
    it('VALID: {items with varying delays} => preserves input order in results', async () => {
      const items = [
        ArrayIndexStub({ value: 30 }),
        ArrayIndexStub({ value: 10 }),
        ArrayIndexStub({ value: 20 }),
      ];
      const handler = async (
        ms: ReturnType<typeof ArrayIndexStub>,
      ): Promise<ReturnType<typeof ContentTextStub>> => {
        await new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
        return ContentTextStub({ value: `done-${String(ms)}` });
      };

      const results = await promisePoolTransformer({ items, concurrency: 3, handler });

      expect(results).toStrictEqual([
        ContentTextStub({ value: 'done-30' }),
        ContentTextStub({ value: 'done-10' }),
        ContentTextStub({ value: 'done-20' }),
      ]);
    });
  });

  describe('concurrency limiting', () => {
    it('VALID: {concurrency of 2 with 4 items} => never exceeds concurrency limit', async () => {
      let active = 0;
      let maxActive = 0;
      const items = [
        ArrayIndexStub({ value: 1 }),
        ArrayIndexStub({ value: 2 }),
        ArrayIndexStub({ value: 3 }),
        ArrayIndexStub({ value: 4 }),
      ];

      const handler = async (
        item: ReturnType<typeof ArrayIndexStub>,
      ): Promise<ReturnType<typeof ArrayIndexStub>> => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        active -= 1;
        return ArrayIndexStub({ value: Number(item) * 2 });
      };

      const results = await promisePoolTransformer({ items, concurrency: 2, handler });

      expect(maxActive).toBe(2);
      expect(results).toStrictEqual([
        ArrayIndexStub({ value: 2 }),
        ArrayIndexStub({ value: 4 }),
        ArrayIndexStub({ value: 6 }),
        ArrayIndexStub({ value: 8 }),
      ]);
    });
  });

  describe('empty items', () => {
    it('VALID: {empty array} => returns empty array', async () => {
      const handler = async (
        item: ReturnType<typeof ArrayIndexStub>,
      ): Promise<ReturnType<typeof ArrayIndexStub>> => Promise.resolve(item);

      const results = await promisePoolTransformer({
        items: [] as ReturnType<typeof ArrayIndexStub>[],
        concurrency: 4,
        handler,
      });

      expect(results).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {handler throws} => rejects with handler error', async () => {
      const items = [
        ArrayIndexStub({ value: 1 }),
        ArrayIndexStub({ value: 2 }),
        ArrayIndexStub({ value: 3 }),
      ];
      const handler = jest
        .fn<Promise<ReturnType<typeof ArrayIndexStub>>, [ReturnType<typeof ArrayIndexStub>]>()
        .mockResolvedValueOnce(ArrayIndexStub({ value: 1 }))
        .mockRejectedValueOnce(new Error('handler-failed'))
        .mockResolvedValueOnce(ArrayIndexStub({ value: 3 }));

      await expect(promisePoolTransformer({ items, concurrency: 1, handler })).rejects.toThrow(
        'handler-failed',
      );
    });
  });
});
