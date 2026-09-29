/**
 * PURPOSE: Curated entry for the browser global `crypto`. `crypto` is the global object itself,
 * captured for callers that write `crypto.randomUUID()`; `randomUuid` reads the global at call time
 * and carries a proxy that stages exact ids. Both forms reach the same method, so one proxy covers
 * either.
 *
 * USAGE:
 * import { crypto, randomUuid } from '#gateway/browser/crypto';
 */

export const { crypto } = globalThis;
export { randomUuid } from './random-uuid/random-uuid';
