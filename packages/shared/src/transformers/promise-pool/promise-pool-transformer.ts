/**
 * PURPOSE: Runs async handlers over items with fixed concurrency or dynamic limit, preserving result order
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
  concurrency = 4,
  handler,
  limit,
}: {
  items: T[];
  concurrency?: number;
  handler: (item: T) => Promise<R>;
  limit?: () => Promise<number>;
}): Promise<R[]> => {
  if (items.length === 0) {
    return [];
  }

  if (!limit) {
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
  }

  return new Promise<R[]>((resolve, reject) => {
    const results: R[] = new Array(items.length) as R[];
    let nextIndex = 0;
    let inFlightCount = 0;
    let hasSettled = false;
    let dispatchQueue: Promise<void> = Promise.resolve();

    const pool = {
      handleFailure: (error: unknown): void => {
        if (!hasSettled) {
          hasSettled = true;
          const rejection = error instanceof Error ? error : new Error(String(error));
          reject(rejection);
        }
      },

      runItem: async (index: number): Promise<void> => {
        try {
          const result = await handler(items[index] as T);
          if (hasSettled) {
            return;
          }
          results[index] = result;
          inFlightCount -= 1;

          if (nextIndex >= items.length && inFlightCount === 0) {
            hasSettled = true;
            resolve(results);
            return;
          }

          pool.queueDispatch();
        } catch (error: unknown) {
          pool.handleFailure(error);
        }
      },

      dispatch: async (): Promise<void> => {
        if (hasSettled || nextIndex >= items.length) {
          return;
        }

        const limitCount = Math.max(1, await limit());

        if (inFlightCount < limitCount && nextIndex < items.length) {
          const currentIndex = nextIndex;
          nextIndex += 1;
          inFlightCount += 1;

          pool.runItem(currentIndex).catch(pool.handleFailure);

          await pool.dispatch();
        }
      },

      queueDispatch: (): void => {
        dispatchQueue = dispatchQueue
          .then(async () => {
            await pool.dispatch();
          })
          .catch(pool.handleFailure);
      },
    };

    pool.queueDispatch();
  });
};
