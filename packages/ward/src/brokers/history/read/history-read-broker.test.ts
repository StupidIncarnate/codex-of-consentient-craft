import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';

import { DurationSampleStub } from '../../../contracts/duration-sample/duration-sample.stub';
import { historyReadBroker } from './history-read-broker';
import { historyReadBrokerProxy } from './history-read-broker.proxy';

describe('historyReadBroker', () => {
  it('EMPTY: {repoRoot with no rows} => returns empty samples array and 0 skipped', () => {
    const proxy = historyReadBrokerProxy();
    proxy.setupDatabase();

    const result = historyReadBroker({ repoRoot: '/repo/root' });

    expect(result).toStrictEqual({ samples: [], skipped: 0 });
  });

  it('VALID: {repoRoot with matching rows} => returns samples in descending order of recorded_at_ms', () => {
    const proxy = historyReadBrokerProxy();
    const older = DurationSampleStub({
      repoRoot: '/repo/root',
      recordedAtMs: 1000,
      durationMs: 1500,
    });
    const newer = DurationSampleStub({
      repoRoot: '/repo/root',
      recordedAtMs: 2000,
      durationMs: 1200,
    });
    proxy.setupSamples({ samples: [older, newer] });

    const result = historyReadBroker({ repoRoot: '/repo/root' });

    expect(result).toStrictEqual({
      samples: [newer, older],
      skipped: 0,
    });
  });

  it('VALID: {rows with different repoRoots} => returns only rows for requested repoRoot', () => {
    const proxy = historyReadBrokerProxy();
    const sampleThis = DurationSampleStub({
      repoRoot: '/repo/this',
      recordedAtMs: 2000,
    });
    const sampleOther = DurationSampleStub({
      repoRoot: '/repo/other',
      recordedAtMs: 3000,
    });
    proxy.setupSamples({ samples: [sampleThis, sampleOther] });

    const result = historyReadBroker({ repoRoot: '/repo/this' });

    expect(result).toStrictEqual({
      samples: [sampleThis],
      skipped: 0,
    });
  });

  it('VALID: {row failing contract validation} => skips invalid row and counts in skipped', () => {
    const proxy = historyReadBrokerProxy();
    const database = DatabaseSyncStub();
    proxy.setupDatabase({ database });

    const validSample = DurationSampleStub({
      repoRoot: '/repo/root',
      recordedAtMs: 2000,
    });
    database
      .prepare(
        'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?);',
      )
      .run(
        validSample.repoRoot,
        validSample.packageName,
        validSample.checkType,
        validSample.durationMs,
        validSample.peakRssMB,
        validSample.shards,
        validSample.recordedAtMs,
      );

    database
      .prepare(
        'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?);',
      )
      .run('/repo/root', 'ward', 'unit', -500, null, null, 1500);

    const result = historyReadBroker({ repoRoot: '/repo/root' });

    expect(result).toStrictEqual({
      samples: [validSample],
      skipped: 1,
    });
  });

  it('ERROR: {registry fails to open} => propagates error upward', () => {
    const proxy = historyReadBrokerProxy();
    const expectedError = new Error('Database connection failed');
    proxy.setupThrows({ error: expectedError });

    expect(() => historyReadBroker({ repoRoot: '/repo/root' })).toThrow(expectedError);
  });
});
