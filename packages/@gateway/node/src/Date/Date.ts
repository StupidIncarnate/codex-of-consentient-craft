/**
 * PURPOSE: Curated entry for the Node global `Date`. Every export lives in its own colocated
 * file with its own `.test.ts`/`.proxy.ts`, so this file holds only re-exports.
 *
 * USAGE:
 * import { now } from '#gateway/node/Date';
 */

export { now } from './now/now';
