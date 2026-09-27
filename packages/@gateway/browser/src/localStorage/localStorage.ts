/**
 * PURPOSE: Curated entry for the browser global `localStorage`. Every read and write is guarded
 * against a disabled/private-mode storage and a full quota, and nothing raw is exported —
 * callers never reach `globalThis.localStorage` directly.
 *
 * USAGE:
 * import { readItem, writeItem, removeItem, keys } from '#gateway/browser/localStorage';
 */

export { keys } from './keys/keys';
export { readItem } from './read-item/read-item';
export { removeItem } from './remove-item/remove-item';
export { writeItem } from './write-item/write-item';
