/**
 * PURPOSE: Removes the handlers registered for one process event, or for every event when no name
 * is given. The no-name form is a separate call on purpose: passing `undefined` to
 * `process.removeAllListeners` removes nothing, so the wrapper never forwards it.
 *
 * USAGE:
 * removeAllListeners('SIGTERM');
 * // Drops every SIGTERM handler; other events keep theirs
 */

export const removeAllListeners = (event?: string | symbol): void => {
  if (event === undefined) {
    process.removeAllListeners();
    return;
  }

  process.removeAllListeners(event);
};
