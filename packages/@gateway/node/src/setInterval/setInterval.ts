/**
 * PURPOSE: Curated entry for the Node global `setInterval`. The wrapper reads the global at call
 * time, so fake timers and spies installed after this module loads still control it. Code outside
 * the gateway schedules a repeating timer through here instead of the raw global, so a future guard
 * lands in one file and reaches every caller.
 *
 * USAGE:
 * import { setInterval } from '#gateway/node/setInterval';
 */

export { setInterval } from './set-interval/set-interval';
