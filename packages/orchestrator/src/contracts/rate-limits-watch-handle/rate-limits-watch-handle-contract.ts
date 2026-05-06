/**
 * PURPOSE: Shape returned by rateLimitsWatchBroker — opaque handle exposing a stop() method to teardown the poller
 *
 * USAGE:
 * rateLimitsWatchHandleContract.parse({ stop: () => undefined });
 * // Returns: RateLimitsWatchHandle. Used by rate-limits-bootstrap-state to track the active watcher.
 */
import { z } from 'zod';

export const rateLimitsWatchHandleContract = z.object({
  stop: z.function().returns(z.void()),
});

export type RateLimitsWatchHandle = z.infer<typeof rateLimitsWatchHandleContract>;
