/**
 * PURPOSE: Caller-facing proxy surface for @dungeonmaster/browser's wrapped modules.
 *
 * USAGE:
 * import { fetchJsonProxy, connectProxy } from '@dungeonmaster/browser/testing';
 */

export { fetchJsonProxy } from '../fetch/fetch-json.proxy';
export { fetchWithStatusProxy } from '../fetch/fetch-with-status.proxy';

export { readItemProxy } from '../localStorage/read-item.proxy';
export { writeItemProxy } from '../localStorage/write-item.proxy';
export { removeItemProxy } from '../localStorage/remove-item.proxy';
export { keysProxy } from '../localStorage/keys.proxy';

export { connectProxy } from '../WebSocket/connect.proxy';

export { openStoreProxy } from '../indexedDB/open-store.proxy';
export { getAllProxy } from '../indexedDB/get-all.proxy';
export { putProxy } from '../indexedDB/put.proxy';
export { deleteRecordProxy } from '../indexedDB/delete-record.proxy';
