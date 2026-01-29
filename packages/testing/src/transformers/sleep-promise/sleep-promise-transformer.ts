/**
 * PURPOSE: Creates a promise that resolves after specified milliseconds
 *
 * USAGE:
 * await sleepPromiseTransformer({ ms: 100 });
 * // Waits 100ms before continuing
 */

export const sleepPromiseTransformer = async ({ ms }: { ms: number }): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
