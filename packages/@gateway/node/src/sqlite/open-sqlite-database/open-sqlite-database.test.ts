import { DatabaseSyncStub } from '../database-sync.stub';
import { NodeVersionUnsupportedError } from '../node-version-unsupported.error';
import { openSqliteDatabase } from './open-sqlite-database';

const REAL_NODE_VERSION = process.versions.node;

const stageNodeVersion = ({ version }: { version: string }): void => {
  Object.defineProperty(process.versions, 'node', {
    configurable: true,
    value: version,
  });
};

describe('openSqliteDatabase', () => {
  describe('Node engine version floor enforcement', () => {
    it('ERROR: {node: "22.15.0"} => throws NodeVersionUnsupportedError naming running version', () => {
      stageNodeVersion({ version: '22.15.0' });
      const action = (): void => {
        try {
          openSqliteDatabase({ filePath: ':memory:' });
        } finally {
          stageNodeVersion({ version: REAL_NODE_VERSION });
        }
      };

      expect(action).toThrow(new NodeVersionUnsupportedError({ runningVersion: '22.15.0' }));
    });

    it('ERROR: {node: "21.16.0"} => throws NodeVersionUnsupportedError naming running version', () => {
      stageNodeVersion({ version: '21.16.0' });
      const action = (): void => {
        try {
          openSqliteDatabase({ filePath: ':memory:' });
        } finally {
          stageNodeVersion({ version: REAL_NODE_VERSION });
        }
      };

      expect(action).toThrow(new NodeVersionUnsupportedError({ runningVersion: '21.16.0' }));
    });

    it('ERROR: {node: "22.15.9"} => throws NodeVersionUnsupportedError naming running version', () => {
      stageNodeVersion({ version: '22.15.9' });
      const action = (): void => {
        try {
          openSqliteDatabase({ filePath: ':memory:' });
        } finally {
          stageNodeVersion({ version: REAL_NODE_VERSION });
        }
      };

      expect(action).toThrow(new NodeVersionUnsupportedError({ runningVersion: '22.15.9' }));
    });

    it('VALID: {node: "22.16.0"} => allows open when running on exact floor', () => {
      stageNodeVersion({ version: '22.16.0' });
      const db = openSqliteDatabase({ filePath: ':memory:' });
      db.exec('CREATE TABLE items (id INT);');
      db.exec('INSERT INTO items (id) VALUES (1);');
      const rows = db.prepare('SELECT id FROM items;').all();
      db.close();
      stageNodeVersion({ version: REAL_NODE_VERSION });

      expect(rows.map((row) => ({ ...row }))).toStrictEqual([{ id: 1 }]);
    });

    it('VALID: {node: "23.0.0"} => allows open when running on newer major version', () => {
      stageNodeVersion({ version: '23.0.0' });
      const db = openSqliteDatabase({ filePath: ':memory:' });
      db.exec('CREATE TABLE items (id INT);');
      db.exec('INSERT INTO items (id) VALUES (2);');
      const rows = db.prepare('SELECT id FROM items;').all();
      db.close();
      stageNodeVersion({ version: REAL_NODE_VERSION });

      expect(rows.map((row) => ({ ...row }))).toStrictEqual([{ id: 2 }]);
    });
  });

  describe('Warning filter and module loading', () => {
    it('VALID: {moduleLoader emits SQLite ExperimentalWarning} => drops SQLite ExperimentalWarning', () => {
      const originalEmitWarning = process.emitWarning;
      const passedWarnings: unknown[][] = [];

      process.emitWarning = ((warning: string | Error, ...args: unknown[]): void => {
        passedWarnings.push([warning, ...args]);
      }) as typeof process.emitWarning;

      const db = openSqliteDatabase({
        filePath: ':memory:',
        moduleLoader: () => {
          process.emitWarning(
            'SQLite is an experimental feature and might change at any time',
            'ExperimentalWarning',
          );
          const memoryDb = DatabaseSyncStub();
          return {
            DatabaseSync: memoryDb.constructor as never,
          };
        },
      });
      db.close();
      process.emitWarning = originalEmitWarning;

      expect(passedWarnings).toStrictEqual([]);
    });

    it('VALID: {moduleLoader emits non-SQLite warning} => passes warning through to emitWarning', () => {
      const originalEmitWarning = process.emitWarning;
      const passedWarnings: unknown[][] = [];

      process.emitWarning = ((warning: string | Error, ...args: unknown[]): void => {
        passedWarnings.push([warning, ...args]);
      }) as typeof process.emitWarning;

      const db = openSqliteDatabase({
        filePath: ':memory:',
        moduleLoader: () => {
          process.emitWarning('Deprecation notice', 'DeprecationWarning');
          const memoryDb = DatabaseSyncStub();
          return {
            DatabaseSync: memoryDb.constructor as never,
          };
        },
      });
      db.close();
      process.emitWarning = originalEmitWarning;

      expect(passedWarnings).toStrictEqual([['Deprecation notice', 'DeprecationWarning']]);
    });

    it('VALID: {moduleLoader emits Error warning} => drops SQLite error warning but passes other error warning', () => {
      const originalEmitWarning = process.emitWarning;
      const passedWarnings: unknown[][] = [];

      process.emitWarning = ((warning: string | Error, ...args: unknown[]): void => {
        passedWarnings.push([warning, ...args]);
      }) as typeof process.emitWarning;

      const sqliteWarningError = new Error('SQLite is experimental');
      sqliteWarningError.name = 'ExperimentalWarning';

      const customWarningError = new Error('Other error warning');
      customWarningError.name = 'CustomWarning';

      const db = openSqliteDatabase({
        filePath: ':memory:',
        moduleLoader: () => {
          process.emitWarning(sqliteWarningError);
          process.emitWarning(customWarningError);
          const memoryDb = DatabaseSyncStub();
          return {
            DatabaseSync: memoryDb.constructor as never,
          };
        },
      });
      db.close();
      process.emitWarning = originalEmitWarning;

      expect(passedWarnings).toStrictEqual([[customWarningError]]);
    });

    it('ERROR: {moduleLoader throws} => restores original emitWarning on throw', () => {
      const originalEmitWarning = process.emitWarning;
      const loadError = new Error('Failed to load sqlite binary');

      expect(() =>
        openSqliteDatabase({
          filePath: ':memory:',
          moduleLoader: () => {
            throw loadError;
          },
        }),
      ).toThrow(loadError);

      expect(process.emitWarning).toBe(originalEmitWarning);
    });
  });

  describe('Database opening and configuration', () => {
    it('VALID: {filePath: ":memory:", busyTimeoutMs: 1000} => returns initialized DatabaseSync', () => {
      const db = openSqliteDatabase({ filePath: ':memory:', busyTimeoutMs: 1000 });
      db.exec('CREATE TABLE test (id INT);');
      db.exec('INSERT INTO test (id) VALUES (42);');
      const rows = db.prepare('SELECT id FROM test;').all();
      db.close();

      expect(rows.map((row) => ({ ...row }))).toStrictEqual([{ id: 42 }]);
    });
  });
});
