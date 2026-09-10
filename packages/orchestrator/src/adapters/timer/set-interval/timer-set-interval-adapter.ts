/**
 * PURPOSE: Wraps setInterval to make it mockable via proxy for unit tests
 *
 * Every caller is a background poller inside a process something else keeps alive — the HTTP
 * server's listening socket, the MCP child's stdin. So the interval is `.unref()`-ed: it must
 * never be the reason a process cannot exit. Without it `start-orchestrator.ts`'s module-load
 * bootstraps hold the loop open in every process that imports the barrel, and the mcp package's
 * jest runs reported them as leaks in every batch — one cause, 38 findings in a single sweep.
 * A caller that genuinely needs an interval to hold the loop open needs a different adapter.
 *
 * USAGE:
 * const handle = timerSetIntervalAdapter({ callback: () => {}, intervalMs: 5000 });
 * handle.stop();
 * // Returns { stop } — call stop() to clearInterval.
 */

export const timerSetIntervalAdapter = ({
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
