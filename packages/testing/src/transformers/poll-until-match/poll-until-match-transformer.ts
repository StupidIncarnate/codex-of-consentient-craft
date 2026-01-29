/**
 * PURPOSE: Polls a check function until it returns a truthy value or timeout
 *
 * USAGE:
 * const result = await pollUntilMatchTransformer({
 *   check: () => outputBuffer.includes('expected') ? outputBuffer : null,
 *   interval: 100,
 *   timeout: 30000,
 *   timeoutMessage: 'Expected content not found',
 * });
 */

import { sleepPromiseTransformer } from '../sleep-promise/sleep-promise-transformer';

export const pollUntilMatchTransformer = async <T>({
  check,
  interval,
  timeout,
  timeoutMessage,
}: {
  check: () => T | null;
  interval: number;
  timeout: number;
  timeoutMessage: string;
}): Promise<T> => {
  const deadline = Date.now() + timeout;

  const result = check();
  if (result !== null) {
    return result;
  }

  if (Date.now() >= deadline) {
    throw new Error(timeoutMessage);
  }

  await sleepPromiseTransformer({ ms: interval });

  return pollUntilMatchTransformer({
    check,
    interval,
    timeout: deadline - Date.now(),
    timeoutMessage,
  });
};
