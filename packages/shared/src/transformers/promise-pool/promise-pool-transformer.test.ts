import { promisePoolTransformer } from './promise-pool-transformer';
import { setTimeout } from '#gateway/node/setTimeout';

describe('promisePoolTransformer', () => {
  describe('result ordering', () => {
    it('VALID: {items with varying delays} => preserves input order in results', async () => {
      const items = [30, 10, 20];
      const handler = async (ms: number): Promise<string> => {
        await new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
        return `done-${String(ms)}`;
      };

      const results = await promisePoolTransformer({ items, concurrency: 3, handler });

      expect(results).toStrictEqual(['done-30', 'done-10', 'done-20']);
    });
  });

  describe('concurrency limiting', () => {
    it('VALID: {concurrency of 2 with 4 items} => never exceeds concurrency limit', async () => {
      let active = 0;
      let maxActive = 0;
      const items = [1, 2, 3, 4];

      const handler = async (item: number): Promise<number> => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        active -= 1;
        return item * 2;
      };

      const results = await promisePoolTransformer({ items, concurrency: 2, handler });

      expect(maxActive).toBe(2);
      expect(results).toStrictEqual([2, 4, 6, 8]);
    });
  });

  describe('empty items', () => {
    it('VALID: {empty array} => returns empty array', async () => {
      const handler = async (item: number): Promise<number> => Promise.resolve(item);

      const results = await promisePoolTransformer({
        items: [] as number[],
        concurrency: 4,
        handler,
      });

      expect(results).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {handler throws} => rejects with handler error', async () => {
      const items = [1, 2, 3];
      const handler = jest
        .fn<Promise<number>, [number]>()
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new Error('handler-failed'))
        .mockResolvedValueOnce(3);

      await expect(promisePoolTransformer({ items, concurrency: 1, handler })).rejects.toThrow(
        'handler-failed',
      );
    });
  });
});
