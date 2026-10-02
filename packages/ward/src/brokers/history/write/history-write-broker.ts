/**
 * PURPOSE: Writes execution duration samples to the registry and bounds historical entries
 *
 * USAGE:
 * historyWriteBroker({ samples });
 * // Inserts samples and retains newest samplesKept per package and check type
 */

import { registryOpenBroker } from '@dungeonmaster/load-balancer/brokers';

import type { DurationSample } from '../../../contracts/duration-sample/duration-sample-contract';
import { durationHistoryStatics } from '../../../statics/duration-history/duration-history-statics';

export const historyWriteBroker = ({ samples }: { samples: readonly DurationSample[] }): void => {
  const database = registryOpenBroker();

  if (samples.length === 0) {
    return;
  }

  database.exec('BEGIN IMMEDIATE;');
  try {
    const insertStatement = database.prepare(
      'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?);',
    );
    for (const sample of samples) {
      insertStatement.run(
        sample.repoRoot,
        sample.packageName,
        sample.checkType,
        sample.durationMs,
        sample.peakRssMB,
        sample.shards,
        sample.recordedAtMs,
      );
    }

    const distinctKeys = new Map<
      string,
      { repoRoot: string; packageName: string; checkType: string }
    >();
    for (const sample of samples) {
      const key = `${sample.repoRoot}\0${sample.packageName}\0${sample.checkType}`;
      if (!distinctKeys.has(key)) {
        distinctKeys.set(key, {
          repoRoot: sample.repoRoot,
          packageName: sample.packageName,
          checkType: sample.checkType,
        });
      }
    }

    const deleteStatement = database.prepare(
      'DELETE FROM durations WHERE repo_root = ? AND package = ? AND check_type = ? AND rowid NOT IN (SELECT rowid FROM durations WHERE repo_root = ? AND package = ? AND check_type = ? ORDER BY recorded_at_ms DESC LIMIT ?);',
    );
    for (const item of distinctKeys.values()) {
      deleteStatement.run(
        item.repoRoot,
        item.packageName,
        item.checkType,
        item.repoRoot,
        item.packageName,
        item.checkType,
        durationHistoryStatics.samplesKept,
      );
    }

    database.exec('COMMIT;');
  } catch (error: unknown) {
    database.exec('ROLLBACK;');
    throw error;
  }
};
