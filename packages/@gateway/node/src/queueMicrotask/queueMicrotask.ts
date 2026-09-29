/**
 * PURPOSE: Curated entry for the global `queueMicrotask`. The wrapper reads the global when it is
 * called, not when this module loads.
 *
 * USAGE:
 * import { queueMicrotask } from '#gateway/node/queueMicrotask';
 */

export { queueMicrotask } from './queue-microtask/queue-microtask';
