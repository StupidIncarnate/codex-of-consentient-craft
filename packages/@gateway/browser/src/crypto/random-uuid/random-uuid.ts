/**
 * PURPOSE: Mints a v4 UUID through the browser global `crypto.randomUUID`. `globalThis.crypto` is
 * read at CALL time, so `randomUuidProxy()` (which replaces the method after this module loads)
 * stages the exact ids a test expects. Reach for this over the barrel's raw `crypto` capture: the
 * proxy covers both, but only this form names the one call a caller makes.
 *
 * USAGE:
 * const attachmentId = randomUuid();
 * // Returns e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 */

export const randomUuid = (): ReturnType<typeof globalThis.crypto.randomUUID> =>
  globalThis.crypto.randomUUID();
