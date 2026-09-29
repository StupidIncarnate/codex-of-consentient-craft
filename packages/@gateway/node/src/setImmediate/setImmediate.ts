/**
 * PURPOSE: Curated entry for the global `setImmediate`. The wrapper reads the global when it is
 * called, not when this module loads, so a harness that swaps or fakes the global afterwards is
 * seen.
 *
 * USAGE:
 * import { setImmediate } from '#gateway/node/setImmediate';
 */

export { setImmediate } from './set-immediate/set-immediate';
