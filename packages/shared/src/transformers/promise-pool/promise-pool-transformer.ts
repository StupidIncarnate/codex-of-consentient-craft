/**
 * PURPOSE: Runs async handlers over items with limited concurrency, preserving result order
 *
 * USAGE:
 * const results = await promisePoolTransformer({
 *   items: [1, 2, 3],
 *   concurrency: 2,
 *   handler: async (item) => item * 2,
 * });
 * // Returns: [2, 4, 6]
 */

export const promisePoolTransformer = async <T, R>({
  items,
  concurrency,
  handler,
}: {
  items: T[];
  concurrency: number;
  handler: (item: T) => Promise<R>;
}): Promise<R[]> => {
  const results: R[] = new Array(items.length) as R[];
  const workerCount = Math.min(concurrency, items.length);
  let nextIndex = 0;

  const pool = {
    runWorker: async (): Promise<void> => {
      if (nextIndex >= items.length) {
        return;
      }

      const currentIndex = nextIndex;
      nextIndex += 1;

      const result = await handler(items[currentIndex] as T);
      results[currentIndex] = result;

      await pool.runWorker();
    },
  };

  const workers = Array.from({ length: workerCount }, async () => {
    await pool.runWorker();
  });

  await Promise.all(workers);

  return results;
};
