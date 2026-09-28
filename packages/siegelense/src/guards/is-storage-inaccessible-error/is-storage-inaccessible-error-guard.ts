/**
 * PURPOSE: True when a rejection from clearing browser storage is the SecurityError a page with no
 * origin throws — `about:blank`, the page a freshly booted instance has never navigated off of, has
 * nothing for `localStorage`/`sessionStorage` to scope to, and Playwright's `page.evaluate` surfaces
 * the browser's own `SecurityError: Failed to read the 'localStorage' property from 'Window': Access
 * is denied for this document.` as a plain rejection with no discriminating `name`. `stepResetBroker`
 * needs this because a `reset` step may run as the very first step against a fresh instance, before
 * any `goto` ever ran.
 *
 * USAGE:
 * isStorageInaccessibleErrorGuard({ error });
 * // Returns true for "SecurityError: ... Access is denied for this document.", false otherwise
 */

const SECURITY_ERROR_NAME = 'SecurityError';
const ACCESS_DENIED_MESSAGE = 'Access is denied';

export const isStorageInaccessibleErrorGuard = ({ error }: { error?: unknown }): boolean => {
  if (error === null || typeof error !== 'object' || !('message' in error)) {
    return false;
  }

  return (
    typeof error.message === 'string' &&
    error.message.includes(SECURITY_ERROR_NAME) &&
    error.message.includes(ACCESS_DENIED_MESSAGE)
  );
};
