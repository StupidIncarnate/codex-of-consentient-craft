/**
 * PURPOSE: Shape returned by rateLimitsWatchBroker — opaque handle exposing a stop() method to teardown the poller
 *
 * USAGE:
 * const handle: RateLimitsWatchHandle = { stop: () => undefined };
 * // Used by rate-limits-bootstrap-state to track the active watcher.
 */

export interface RateLimitsWatchHandle {
  stop: () => void;
}
