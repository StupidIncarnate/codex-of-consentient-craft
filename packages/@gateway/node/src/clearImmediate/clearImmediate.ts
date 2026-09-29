/**
 * PURPOSE: Curated entry for the global `clearImmediate`. The wrapper reads the global when it is
 * called, not when this module loads.
 *
 * USAGE:
 * import { clearImmediate } from '#gateway/node/clearImmediate';
 */

export { clearImmediate } from './clear-immediate/clear-immediate';
