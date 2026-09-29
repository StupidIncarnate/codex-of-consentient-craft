/**
 * PURPOSE: Curated entry for the Node global `clearInterval`. The wrapper reads the global at call
 * time, so a timer armed through a spied or instrumented global is cancelled through it too. Code
 * outside the gateway cancels a repeating timer through here instead of the raw global, so a future
 * guard lands in one file and reaches every caller.
 *
 * USAGE:
 * import { clearInterval } from '#gateway/node/clearInterval';
 */

export { clearInterval } from './clear-interval/clear-interval';
