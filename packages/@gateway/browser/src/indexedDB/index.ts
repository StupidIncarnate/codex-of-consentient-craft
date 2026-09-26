/**
 * PURPOSE: Curated entry for the browser global `indexedDB`. `openStore` self-heals a version
 * mismatch and a store missing at the expected version; `getAll`/`put`/`deleteRecord` are guarded
 * transaction wrappers. Nothing raw is exported.
 *
 * USAGE:
 * import { openStore, getAll, put, deleteRecord } from '@dungeonmaster/browser/indexedDB';
 */

export { openStore } from './open-store';
export { getAll } from './get-all';
export { put } from './put';
export { deleteRecord } from './delete-record';
