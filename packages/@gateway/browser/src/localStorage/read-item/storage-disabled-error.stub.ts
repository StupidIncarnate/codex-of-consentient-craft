/**
 * PURPOSE: A real `SecurityError`-named `Error`, the shape `readItem`/`writeItem`/`removeItem`/`keys`
 * all catch and degrade — storage disabled by a private-mode browser or a locked-down webview. Built
 * by hand rather than triggered for real, because nothing in this jsdom test environment can
 * actually put `localStorage` into a disabled state to capture the failure from.
 *
 * USAGE:
 * const error = StorageDisabledErrorStub();
 * // Returns a real Error: { name: 'SecurityError', message: 'access denied' }
 */

export const StorageDisabledErrorStub = ({
  message = 'access denied',
}: { message?: string } = {}): Error =>
  Object.assign(new Error(message), { name: 'SecurityError' });
