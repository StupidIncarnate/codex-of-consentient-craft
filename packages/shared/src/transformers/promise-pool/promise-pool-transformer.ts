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

  const workers = Array.from({ length: workerCount }, async (_unused, workerIndex) =>
    items.reduce(
      async (chain, _item, itemIndex) =>
        itemIndex % workerCount === workerIndex
          ? chain.then(async () =>
              handler(items[itemIndex] as T).then((result) => {
                results[itemIndex] = result;
              }),
            )
          : chain,
      Promise.resolve(),
    ),
  );

  await Promise.all(workers);

  return results;
};
