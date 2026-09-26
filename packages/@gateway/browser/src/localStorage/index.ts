/**
 * PURPOSE: Curated entry for the browser global `localStorage`. Every read and write is guarded
 * against a disabled/private-mode storage and a full quota, and nothing raw is exported —
 * callers never reach `globalThis.localStorage` directly.
 *
 * USAGE:
 * import { readItem, writeItem, removeItem, keys } from '@dungeonmaster/browser/localStorage';
 */

export { readItem } from './read-item';
export { writeItem } from './write-item';
export { removeItem } from './remove-item';
export { keys } from './keys';
