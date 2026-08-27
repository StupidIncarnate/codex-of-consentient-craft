/**
 * PURPOSE: Wraps setInterval to make it mockable via proxy for unit tests
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
  return {
    stop: (): void => {
      clearInterval(handle);
    },
  };
};
