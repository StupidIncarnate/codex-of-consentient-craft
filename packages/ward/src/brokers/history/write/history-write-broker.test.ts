import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';

import { DurationSampleStub } from '../../../contracts/duration-sample/duration-sample.stub';
import { durationHistoryStatics } from '../../../statics/duration-history/duration-history-statics';
import { historyWriteBroker } from './history-write-broker';
import { historyWriteBrokerProxy } from './history-write-broker.proxy';

describe('historyWriteBroker', () => {
  it('EMPTY: {samples: []} => returns early without running transaction', () => {
    const proxy = historyWriteBrokerProxy();
    const database = DatabaseSyncStub();
    proxy.setupDatabase({ database });

    historyWriteBroker({ samples: [] });

    const rawRows = database.prepare('SELECT * FROM durations;').all();
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([]);
  });

  it('VALID: {samples within samplesKept} => inserts all samples into durations table', () => {
    const proxy = historyWriteBrokerProxy();
    const database = DatabaseSyncStub();
    proxy.setupDatabase({ database });

    const sample1 = DurationSampleStub({
      repoRoot: '/repo/root',
      packageName: 'ward',
      checkType: 'unit',
      durationMs: 1000,
      recordedAtMs: 100,
    });
    const sample2 = DurationSampleStub({
      repoRoot: '/repo/root',
      packageName: 'ward',
      checkType: 'lint',
      durationMs: 2000,
      recordedAtMs: 200,
    });

    historyWriteBroker({ samples: [sample1, sample2] });

    const rawRows = database
      .prepare(
        'SELECT repo_root, package, check_type, duration_ms, recorded_at_ms FROM durations ORDER BY recorded_at_ms ASC;',
      )
      .all();
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([
      {
        repo_root: sample1.repoRoot,
        package: sample1.packageName,
        check_type: sample1.checkType,
        duration_ms: sample1.durationMs,
        recorded_at_ms: sample1.recordedAtMs,
      },
      {
        repo_root: sample2.repoRoot,
        package: sample2.packageName,
        check_type: sample2.checkType,
        duration_ms: sample2.durationMs,
        recorded_at_ms: sample2.recordedAtMs,
      },
    ]);
  });

  it('VALID: {samples exceeding samplesKept} => trims oldest rows keeping newest samplesKept', () => {
    const proxy = historyWriteBrokerProxy();
    const database = DatabaseSyncStub();
    proxy.setupDatabase({ database });

    const totalSamples = durationHistoryStatics.samplesKept + 2;
    const samples = Array.from({ length: totalSamples }, (_, index) =>
      DurationSampleStub({
        repoRoot: '/repo/root',
        packageName: 'ward',
        checkType: 'unit',
        durationMs: 1000 + index * 10,
        recordedAtMs: 1000 + index * 10,
      }),
    );

    historyWriteBroker({ samples });

    const rawRows = database
      .prepare('SELECT duration_ms, recorded_at_ms FROM durations ORDER BY recorded_at_ms ASC;')
      .all();
    const rows = rawRows.map((row) => ({ ...row }));

    const expected = samples.slice(2).map((sample) => ({
      duration_ms: sample.durationMs,
      recorded_at_ms: sample.recordedAtMs,
    }));

    expect(rows).toStrictEqual(expected);
  });

  it('ERROR: {error during write} => rolls back transaction and rethrows error', () => {
    const proxy = historyWriteBrokerProxy();
    const database = DatabaseSyncStub();
    proxy.setupDatabase({ database });

    database
      .prepare(
        'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?);',
      )
      .run('/repo/root', 'ward', 'unit', 500, null, null, 50);

    const expectedError = new Error('Disk full');
    const originalPrepare = database.prepare.bind(database);
    database.prepare = () => {
      throw expectedError;
    };

    const sample = DurationSampleStub({
      repoRoot: '/repo/root',
      recordedAtMs: 100,
    });

    expect(() => {
      historyWriteBroker({ samples: [sample] });
    }).toThrow(expectedError);

    database.prepare = originalPrepare;
    const rawRows = database.prepare('SELECT duration_ms FROM durations;').all();
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([{ duration_ms: 500 }]);
  });
});
