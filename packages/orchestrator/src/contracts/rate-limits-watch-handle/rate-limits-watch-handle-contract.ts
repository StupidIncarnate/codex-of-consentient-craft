/**
 * PURPOSE: Shape returned by rateLimitsWatchBroker — opaque handle exposing a stop() method to teardown the poller
 *
 * USAGE:
 * rateLimitsWatchHandleContract.parse({ stop: () => undefined });
 * // Returns: RateLimitsWatchHandle. Used by rate-limits-bootstrap-state to track the active watcher.
 */
import { z } from 'zod';

// `stop` is a function — a Zod object schema cannot check callability, so it stays out of the
// parse and is attached only through the type intersection below. `.loose()` carries it
// through `.parse()` unvalidated when a real caller supplies one.
export const rateLimitsWatchHandleContract = z.object({}).loose();

export type RateLimitsWatchHandle = z.infer<typeof rateLimitsWatchHandleContract> & {
  stop: () => void;
};
