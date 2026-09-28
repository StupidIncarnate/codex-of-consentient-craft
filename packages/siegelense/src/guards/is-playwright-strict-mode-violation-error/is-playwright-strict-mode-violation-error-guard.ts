/**
 * PURPOSE: True when a rejection Playwright's strict locator produced is a "strict mode violation"
 * — a target that resolved to more than one element — and false for every other failure the same
 * call can raise. `until { visible }` needs this because it is one of the two waits in the package
 * that never pre-resolves its target through `stepTargetResolveBroker` (`waitFor` does; that is
 * exactly why `waitFor` cannot wait for an element to APPEAR while this form can), so an ambiguous
 * selector meets Playwright's strict locator directly and raises this rather than an AMBIGUOUS
 * error of this package's own. Reads the rejection's `message`, never `name`: unlike Playwright's own
 * `TimeoutError`, a strict-mode violation is a plain `Error` with no discriminating `name` — the same
 * shape `isPlaywrightTimeoutErrorGuard`'s own header measured for the identical rejection.
 *
 * USAGE:
 * isPlaywrightStrictModeViolationErrorGuard({ error });
 * // Returns true for "strict mode violation: locator(...) resolved to 2 elements", false for a
 * // Playwright TimeoutError or any other rejection
 */

const STRICT_MODE_VIOLATION_MESSAGE = 'strict mode violation';

export const isPlaywrightStrictModeViolationErrorGuard = ({
  error,
}: {
  error?: unknown;
}): boolean => {
  if (error === null || typeof error !== 'object' || !('message' in error)) {
    return false;
  }

  return typeof error.message === 'string' && error.message.includes(STRICT_MODE_VIOLATION_MESSAGE);
};
