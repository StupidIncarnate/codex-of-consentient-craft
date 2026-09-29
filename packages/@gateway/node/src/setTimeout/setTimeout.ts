/**
 * PURPOSE: Curated entry for the Node global `setTimeout`. The wrapper reads the global at call
 * time, so fake timers and spies installed after this module loads still control it. Code outside
 * the gateway schedules a timer through here instead of the raw global, so a future guard lands in
 * one file and reaches every caller.
 *
 * USAGE:
 * import { setTimeout } from '#gateway/node/setTimeout';
 */

export { setTimeout } from './set-timeout/set-timeout';
