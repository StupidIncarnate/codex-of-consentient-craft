/**
 * PURPOSE: Reads duration and resource usage samples for a repository root from the registry
 *
 * USAGE:
 * const { samples, skipped } = historyReadBroker({ repoRoot: '/path/to/repo' });
 * // Returns { samples: DurationSample[], skipped: 0 }
 */

import { registryOpenBroker } from '@dungeonmaster/load-balancer/brokers';

import {
  durationSampleContract,
  type DurationSample,
} from '../../../contracts/duration-sample/duration-sample-contract';

export const historyReadBroker = ({
  repoRoot,
}: {
  repoRoot: string;
}): {
  samples: DurationSample[];
  skipped: number;
} => {
  const database = registryOpenBroker();
  const statement = database.prepare(
    'SELECT repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms FROM durations WHERE repo_root = ? ORDER BY recorded_at_ms DESC;',
  );
  const rows = statement.all(repoRoot);

  const samples: DurationSample[] = [];
  let skipped = 0;

  for (const row of rows) {
    const mapped = {
      repoRoot: row.repo_root,
      packageName: row.package,
      checkType: row.check_type,
      durationMs: row.duration_ms,
      peakRssMB: row.peak_rss_mb,
      shards: row.shards,
      recordedAtMs: row.recorded_at_ms,
    };

    const parsed = durationSampleContract.safeParse(mapped);
    if (parsed.success) {
      samples.push(parsed.data);
    } else {
      skipped += 1;
    }
  }

  return { samples, skipped };
};
