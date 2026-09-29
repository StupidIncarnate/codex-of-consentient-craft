/**
 * PURPOSE: Curated entry for the Node global `clearTimeout`. The wrapper reads the global at call
 * time, so a timer armed through a spied or instrumented global is cancelled through it too. Code
 * outside the gateway cancels a timer through here instead of the raw global, so a future guard
 * lands in one file and reaches every caller.
 *
 * USAGE:
 * import { clearTimeout } from '#gateway/node/clearTimeout';
 */

export { clearTimeout } from './clear-timeout/clear-timeout';
