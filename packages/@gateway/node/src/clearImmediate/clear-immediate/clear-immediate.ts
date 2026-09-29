/**
 * PURPOSE: Cancels an immediate scheduled through `setImmediate` before it runs. Cancelling an
 * already-run or already-cancelled handle, or passing `undefined`, is a no-op. Reads
 * `globalThis.clearImmediate` when called.
 *
 * USAGE:
 * const handle = setImmediate(() => work());
 * clearImmediate(handle);
 * // work() never runs
 */

export const clearImmediate = (handle: NodeJS.Immediate | undefined): void => {
  globalThis.clearImmediate(handle);
};
