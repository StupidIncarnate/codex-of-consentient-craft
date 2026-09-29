/**
 * PURPOSE: A real `QuotaExceededError`-named `Error`, the shape `writeItem` catches and returns
 * as `{ success: false, error }` when `setItem` has no room left. Built by hand rather than
 * triggered for real, because nothing in this jsdom test environment can fill `localStorage` to
 * capture the failure from.
 *
 * USAGE:
 * const error = StorageQuotaErrorStub();
 * // Returns a real Error: { name: 'QuotaExceededError', message: 'quota exceeded' }
 */

export const StorageQuotaErrorStub = ({
  message = 'quota exceeded',
}: { message?: string } = {}): Error =>
  Object.assign(new Error(message), { name: 'QuotaExceededError' });
