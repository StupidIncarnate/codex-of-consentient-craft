import { Worker } from 'worker_threads';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { setTimeout as delayTimer } from '../../setTimeout/set-timeout/set-timeout';
import { openSqliteDatabase } from './open-sqlite-database';

describe('openSqliteDatabase integration', () => {
  it('VALID: {two concurrent writers with busy timeout} => waits on lock, both inserts succeed, no ExperimentalWarning on stderr', async () => {
    const testbed = installTestbedCreateBroker({ baseName: 'sqlite-gateway-integration' });
    const dbPath = `${testbed.guildPath}/concurrent-test.db`;

    const stderrChunks: string[] = [];
    const originalStderrWrite = process.stderr.write;
    process.stderr.write = ((chunk: string | Uint8Array): boolean => {
      stderrChunks.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    let db1: ReturnType<typeof openSqliteDatabase>;
    try {
      db1 = openSqliteDatabase({ filePath: dbPath, busyTimeoutMs: 2000 });
    } finally {
      process.stderr.write = originalStderrWrite;
    }

    const capturedStderr = stderrChunks.join('');

    expect(capturedStderr).toBe('');

    db1.exec('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT);');
    db1.exec('BEGIN IMMEDIATE;');
    db1.exec("INSERT INTO items (name) VALUES ('first');");

    const commitDelayMs = 200;
    delayTimer(() => {
      db1.exec('COMMIT;');
    }, commitDelayMs);

    await new Promise<void>((resolve, reject) => {
      const workerCode = `
        const { DatabaseSync } = require('node:sqlite');
        const { workerData, parentPort } = require('node:worker_threads');
        const db2 = new DatabaseSync(workerData.filePath, { timeout: workerData.busyTimeoutMs });
        db2.exec('PRAGMA journal_mode=WAL;');
        db2.exec("INSERT INTO items (name) VALUES ('second');");
        db2.close();
        parentPort.postMessage({ success: true });
      `;
      const worker = new Worker(workerCode, {
        eval: true,
        workerData: { filePath: dbPath, busyTimeoutMs: 2000 },
      });
      worker.on('message', () => {
        resolve();
      });
      worker.on('error', reject);
    });

    const rows = db1.prepare('SELECT name FROM items ORDER BY id;').all();
    db1.close();
    testbed.cleanup();

    expect(rows.map((row) => ({ ...row }))).toStrictEqual([{ name: 'first' }, { name: 'second' }]);
  });
});
