/**
 * PURPOSE: Gateway entry for opening SQLite databases with automatic WAL journal mode, busy
 * timeout, and Node engine floor enforcement. Reach for this over raw node:sqlite to ensure
 * multi-process concurrency safety and suppression of Node 22's experimental SQLite warning.
 *
 * USAGE:
 * const db = openSqliteDatabase({ filePath: '/path/to/db.sqlite', busyTimeoutMs: 5000 });
 */

import { createRequire } from 'module';
import type { DatabaseSync } from 'node:sqlite';
import { NodeVersionUnsupportedError } from '../node-version-unsupported.error';

const MINIMUM_NODE_MAJOR = 22;
const MINIMUM_NODE_MINOR = 16;
const MINIMUM_NODE_PATCH = 0;

type DatabaseSyncConstructor = new (
  filePath: string,
  options?: { timeout?: number },
) => DatabaseSync;

let cachedDatabaseSync: DatabaseSyncConstructor | null = null;

export const openSqliteDatabase = ({
  filePath,
  busyTimeoutMs,
  moduleLoader,
}: {
  filePath: string;
  busyTimeoutMs?: number;
  moduleLoader?: () => { DatabaseSync: DatabaseSyncConstructor };
}): DatabaseSync => {
  const runningVersion = process.versions.node;
  const [majorString = '0', minorString = '0', patchString = '0'] = runningVersion.split('.');
  const major = Number(majorString);
  const minor = Number(minorString);
  const patch = Number(patchString.split('-')[0] ?? '0');

  const isOlderVersion =
    major < MINIMUM_NODE_MAJOR ||
    (major === MINIMUM_NODE_MAJOR &&
      (minor < MINIMUM_NODE_MINOR || (minor === MINIMUM_NODE_MINOR && patch < MINIMUM_NODE_PATCH)));

  if (isOlderVersion) {
    throw new NodeVersionUnsupportedError({ runningVersion });
  }

  let DatabaseSyncClass = cachedDatabaseSync;

  if (moduleLoader !== undefined) {
    const descriptor = Object.getOwnPropertyDescriptor(process, 'emitWarning');
    const originalEmitWarning = descriptor?.value as (...args: unknown[]) => void;

    process.emitWarning = ((warning: string | Error, ...args: unknown[]): void => {
      let warningMessage = '';
      let warningType: unknown = null;

      if (typeof warning === 'string') {
        warningMessage = warning;
        const [firstArg] = args;
        if (typeof firstArg === 'string') {
          warningType = firstArg;
        } else if (firstArg !== null && typeof firstArg === 'object' && 'type' in firstArg) {
          warningType = (firstArg as { type?: unknown }).type;
        }
      } else if (warning instanceof Error) {
        warningMessage = warning.message;
        warningType = warning.name;
      }

      if (warningType === 'ExperimentalWarning' && warningMessage.startsWith('SQLite')) {
        return;
      }

      originalEmitWarning.apply(process, [warning, ...args]);
    }) as typeof process.emitWarning;

    try {
      const loaded = moduleLoader();
      DatabaseSyncClass = loaded.DatabaseSync;
    } finally {
      if (descriptor !== undefined) {
        Object.defineProperty(process, 'emitWarning', descriptor);
      }
    }
  } else if (DatabaseSyncClass === null) {
    const descriptor = Object.getOwnPropertyDescriptor(process, 'emitWarning');
    const originalEmitWarning = descriptor?.value as (...args: unknown[]) => void;

    process.emitWarning = ((warning: string | Error, ...args: unknown[]): void => {
      let warningMessage = '';
      let warningType: unknown = null;

      if (typeof warning === 'string') {
        warningMessage = warning;
        const [firstArg] = args;
        if (typeof firstArg === 'string') {
          warningType = firstArg;
        } else if (firstArg !== null && typeof firstArg === 'object' && 'type' in firstArg) {
          warningType = (firstArg as { type?: unknown }).type;
        }
      } else if (warning instanceof Error) {
        warningMessage = warning.message;
        warningType = warning.name;
      }

      if (warningType === 'ExperimentalWarning' && warningMessage.startsWith('SQLite')) {
        return;
      }

      originalEmitWarning.apply(process, [warning, ...args]);
    }) as typeof process.emitWarning;

    try {
      const nodeRequire = createRequire(__filename);
      const sqliteModule = nodeRequire('node:sqlite') as {
        DatabaseSync: DatabaseSyncConstructor;
      };
      DatabaseSyncClass = sqliteModule.DatabaseSync;
      cachedDatabaseSync = DatabaseSyncClass;
    } finally {
      if (descriptor !== undefined) {
        Object.defineProperty(process, 'emitWarning', descriptor);
      }
    }
  }

  const database =
    busyTimeoutMs === undefined
      ? new DatabaseSyncClass(filePath)
      : new DatabaseSyncClass(filePath, { timeout: busyTimeoutMs });

  database.exec('PRAGMA journal_mode=WAL;');
  return database;
};
