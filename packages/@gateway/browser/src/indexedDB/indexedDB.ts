/**
 * PURPOSE: Curated entry for the browser global `indexedDB`. `openStore` self-heals a version
 * mismatch and a store missing at the expected version; `getAll`/`put`/`deleteRecord` are guarded
 * transaction wrappers; `replaceAll` rewrites a whole store in one transaction. Nothing raw is exported.
 *
 * USAGE:
 * import { openStore, getAll, put, deleteRecord, replaceAll } from '#gateway/browser/indexedDB';
 */

export { deleteRecord } from './delete-record/delete-record';
export { getAll } from './get-all/get-all';
export { openStore } from './open-store/open-store';
export { put } from './put/put';
export { replaceAll } from './replace-all/replace-all';
