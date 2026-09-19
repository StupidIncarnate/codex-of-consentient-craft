/**
 * PURPOSE: True when a rejection Playwright produced is its own `TimeoutError` — the wait ran out —
 * and false for every other failure it can raise from the same call. `until`'s `visible` and
 * `predicate` forms need this because they are the only waits in the package that do NOT pre-resolve
 * their target: `waitFor` goes through `stepTargetResolveBroker` first, so an ambiguous selector is
 * already an AMBIGUOUS error before its wait begins, while `until { visible }` hands the selector
 * straight to Playwright's strict locator. Without this guard both forms report every failure as a
 * ceiling hit, so `RunStatus` answers `'timeout'` for a selector matching two elements and tells a
 * walker to wait longer for something already on the screen twice — and a `predicate` whose source
 * throws reads identically to one that is merely false.
 *
 * Reads `name`, never `instanceof`: Playwright constructs its errors outside the vm realm a Jest test
 * file runs inside, so the prototype chain answers false for a value that genuinely is one — the same
 * cross-realm failure `error-is-native-error-adapter.ts` documents. `name` is a plain property read
 * and answers correctly whichever realm built the value.
 *
 * USAGE:
 * isPlaywrightTimeoutErrorGuard({ error });
 * // Returns true for a Playwright TimeoutError, false for a strict-mode violation
 */

// Playwright's own public discriminator — `playwright.errors.TimeoutError` sets this on every
// instance, and it is the one field that survives the realm boundary intact.
const PLAYWRIGHT_TIMEOUT_ERROR_NAME = 'TimeoutError';

export const isPlaywrightTimeoutErrorGuard = ({ error }: { error?: unknown }): boolean => {
  if (error === null || typeof error !== 'object' || !('name' in error)) {
    return false;
  }

  return error.name === PLAYWRIGHT_TIMEOUT_ERROR_NAME;
};
