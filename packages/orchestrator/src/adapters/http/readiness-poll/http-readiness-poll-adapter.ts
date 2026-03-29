/**
 * PURPOSE: Polls a URL with exponential backoff until any non-error HTTP response or timeout
 *
 * USAGE:
 * const result = await httpReadinessPollAdapter({ url: 'http://localhost:3000/', timeoutMs: 30000 });
 * // Returns { ready: boolean; elapsedMs: ElapsedMs }
 */

import {
  elapsedMsContract,
  type ElapsedMs,
} from '../../../contracts/elapsed-ms/elapsed-ms-contract';

export interface HttpReadinessPollResult {
  ready: boolean;
  elapsedMs: ElapsedMs;
}

const BASE_INTERVAL_MS = 500;
const MAX_INTERVAL_MS = 4000;
const BACKOFF_MULTIPLIER = 2;
const HTTP_SERVER_ERROR_THRESHOLD = 500;

export const httpReadinessPollAdapter = async ({
  url,
  timeoutMs,
  intervalMs = BASE_INTERVAL_MS,
  abortSignal,
}: {
  url: string;
  timeoutMs: number;
  intervalMs?: number;
  abortSignal?: AbortSignal;
}): Promise<HttpReadinessPollResult> =>
  new Promise((resolve) => {
    const startTime = Date.now();
    let currentInterval = intervalMs;
    let settled = false;
    const state: { poll: () => void } = { poll: () => undefined };

    state.poll = () => {
      const elapsedSoFar = Date.now() - startTime;
      if (elapsedSoFar >= timeoutMs || Boolean(abortSignal?.aborted)) {
        if (!settled) {
          settled = true;
          resolve({ ready: false, elapsedMs: elapsedMsContract.parse(elapsedSoFar) });
        }
        return;
      }
      fetch(url, { signal: abortSignal ?? null })
        .then((response) => {
          if (!settled) {
            if (response.status < HTTP_SERVER_ERROR_THRESHOLD) {
              settled = true;
              resolve({ ready: true, elapsedMs: elapsedMsContract.parse(Date.now() - startTime) });
              return;
            }
          }
          const remaining = timeoutMs - (Date.now() - startTime);
          if (remaining <= 0 || Boolean(abortSignal?.aborted) || settled) {
            if (!settled) {
              settled = true;
              resolve({
                ready: false,
                elapsedMs: elapsedMsContract.parse(Date.now() - startTime),
              });
            }
            return;
          }
          const sleepMs = Math.min(currentInterval, remaining);
          currentInterval = Math.min(currentInterval * BACKOFF_MULTIPLIER, MAX_INTERVAL_MS);
          setTimeout(state.poll, sleepMs);
        })
        .catch(() => {
          const remaining = timeoutMs - (Date.now() - startTime);
          if (remaining <= 0 || Boolean(abortSignal?.aborted) || settled) {
            if (!settled) {
              settled = true;
              resolve({
                ready: false,
                elapsedMs: elapsedMsContract.parse(Date.now() - startTime),
              });
            }
            return;
          }
          const sleepMs = Math.min(currentInterval, remaining);
          currentInterval = Math.min(currentInterval * BACKOFF_MULTIPLIER, MAX_INTERVAL_MS);
          setTimeout(state.poll, sleepMs);
        });
    };

    state.poll();
  });
