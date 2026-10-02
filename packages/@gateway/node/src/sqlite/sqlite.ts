/**
 * PURPOSE: Gateway entry for SQLite database access.
 *
 * USAGE:
 * import { openSqliteDatabase, NodeVersionUnsupportedError } from '#gateway/node/sqlite';
 */

export { openSqliteDatabase } from './open-sqlite-database/open-sqlite-database';
export { NodeVersionUnsupportedError } from './node-version-unsupported.error';
