/**
 * PURPOSE: A real in-memory `DatabaseSync` instance from `node:sqlite`, for tests that need a
 * database handle without touching disk.
 *
 * USAGE:
 * const db = DatabaseSyncStub();
 * db.exec('CREATE TABLE test (id INT);');
 */

import { DatabaseSync } from 'node:sqlite';

export const DatabaseSyncStub = (): DatabaseSync => new DatabaseSync(':memory:');
