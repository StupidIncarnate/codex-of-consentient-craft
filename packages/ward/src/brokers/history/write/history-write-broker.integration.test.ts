import { mkdtempSync, rmSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { deleteEnv, setEnv } from '#gateway/node/process';
import { registryOpenBroker } from '@dungeonmaster/load-balancer/brokers';

import { DurationSampleStub } from '../../../contracts/duration-sample/duration-sample.stub';
import { historyReadBroker } from '../read/history-read-broker';
import { historyWriteBroker } from './history-write-broker';

type DurationSample = ReturnType<typeof DurationSampleStub>;

describe('history integration (read and write)', () => {
  it('VALID: {7 samples written for one key} => returns 5 newest in descending order', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'history-integration-test-'));
    setEnv('DUNGEONMASTER_LOAD_DIR', tempDir);

    let result: ReturnType<typeof historyReadBroker> | undefined;
    let expected: DurationSample[] | undefined;

    try {
      const repoRoot = '/test/repo';
      const packageName = 'ward';
      const checkType = 'unit';

      const samples = [10, 20, 30, 40, 50, 60, 70].map((step) =>
        DurationSampleStub({
          repoRoot,
          packageName,
          checkType,
          durationMs: step * 100,
          peakRssMB: step * 10,
          shards: null,
          recordedAtMs: step * 1000,
        }),
      );

      historyWriteBroker({ samples });

      result = historyReadBroker({ repoRoot });

      expected = samples.slice(2).reverse();
    } finally {
      deleteEnv('DUNGEONMASTER_LOAD_DIR');
      rmSync(tempDir, { recursive: true, force: true });
    }

    expect(result).toStrictEqual({
      samples: expected,
      skipped: 0,
    });
  });

  it('VALID: {samples for two different repo roots and packages} => isolates keys independently', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'history-integration-test-'));
    setEnv('DUNGEONMASTER_LOAD_DIR', tempDir);

    let resultA: ReturnType<typeof historyReadBroker> | undefined;
    let resultB: ReturnType<typeof historyReadBroker> | undefined;
    let sampleA1: DurationSample | undefined;
    let sampleA2: DurationSample | undefined;
    let sampleB1: DurationSample | undefined;

    try {
      const repoA = '/test/repo-a';
      const repoB = '/test/repo-b';

      sampleA1 = DurationSampleStub({
        repoRoot: repoA,
        packageName: 'ward',
        checkType: 'unit',
        durationMs: 1200,
        recordedAtMs: 1000,
      });
      sampleA2 = DurationSampleStub({
        repoRoot: repoA,
        packageName: 'load-balancer',
        checkType: 'lint',
        durationMs: 800,
        recordedAtMs: 2000,
      });
      sampleB1 = DurationSampleStub({
        repoRoot: repoB,
        packageName: 'ward',
        checkType: 'unit',
        durationMs: 1500,
        recordedAtMs: 3000,
      });

      historyWriteBroker({ samples: [sampleA1, sampleA2, sampleB1] });

      resultA = historyReadBroker({ repoRoot: repoA });
      resultB = historyReadBroker({ repoRoot: repoB });
    } finally {
      deleteEnv('DUNGEONMASTER_LOAD_DIR');
      rmSync(tempDir, { recursive: true, force: true });
    }

    expect(resultA).toStrictEqual({
      samples: [sampleA2, sampleA1],
      skipped: 0,
    });
    expect(resultB).toStrictEqual({
      samples: [sampleB1],
      skipped: 0,
    });
  });

  it('VALID: {durations table containing an invalid row} => skips invalid row and counts in skipped', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'history-integration-test-'));
    setEnv('DUNGEONMASTER_LOAD_DIR', tempDir);

    let result: ReturnType<typeof historyReadBroker> | undefined;
    let validSample: DurationSample | undefined;

    try {
      const repoRoot = '/test/repo-invalid';
      validSample = DurationSampleStub({
        repoRoot,
        packageName: 'ward',
        checkType: 'unit',
        durationMs: 1000,
        recordedAtMs: 2000,
      });

      historyWriteBroker({ samples: [validSample] });

      const database = registryOpenBroker();
      database
        .prepare(
          'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?);',
        )
        .run(repoRoot, 'ward', 'unit', -100, null, null, 1500);

      result = historyReadBroker({ repoRoot });
    } finally {
      deleteEnv('DUNGEONMASTER_LOAD_DIR');
      rmSync(tempDir, { recursive: true, force: true });
    }

    expect(result).toStrictEqual({
      samples: [validSample],
      skipped: 1,
    });
  });
});
