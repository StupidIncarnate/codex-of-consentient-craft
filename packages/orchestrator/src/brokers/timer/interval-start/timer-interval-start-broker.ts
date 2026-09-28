/**
 * PURPOSE: Starts a repeating timer that never keeps the process alive, and hands back its stop
 * handle. Every caller is a background poller inside a process something else holds open — the
 * HTTP server's listening socket, the MCP child's stdin — so the interval is `.unref()`-ed: it
 * must never be the reason a process cannot exit. Without it the pollers
 * `StartOrchestrator.bootstrap()` starts hold the loop open in every process that runs them, and
 * jest reports each as a leak. A caller that genuinely needs an interval to hold the loop open
 * calls `setInterval` from `#gateway/node/setInterval` itself.
 *
 * USAGE:
 * const handle = timerIntervalStartBroker({ callback: () => {}, intervalMs: 5000 });
 * handle.stop();
 * // Returns { stop } — call stop() to clear the interval.
 */

import { clearInterval } from '#gateway/node/clearInterval';
import { setInterval } from '#gateway/node/setInterval';

export const timerIntervalStartBroker = ({
  callback,
  intervalMs,
}: {
  callback: () => void;
  intervalMs: number;
}): { stop: () => void } => {
  const handle = setInterval(callback, intervalMs);
  handle.unref();
  return {
    stop: (): void => {
      clearInterval(handle);
    },
  };
};
