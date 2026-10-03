/**
 * PURPOSE: Opens the SQLite duration registry database, ensuring the storage directory and schema exist.
 *
 * USAGE:
 * const db = registryOpenBroker();
 * // Returns DatabaseSync instance connected to registry-v1.db
 */

import { ensureDirSync } from '#gateway/node/fs';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { getEnv } from '#gateway/node/process';
import { openSqliteDatabase } from '#gateway/node/sqlite';
import { loadBalancerStatics } from '../../../statics/load-balancer/load-balancer-statics';

export const registryOpenBroker = (): ReturnType<typeof openSqliteDatabase> => {
  const envDir = getEnv(loadBalancerStatics.registry.dirEnvVar);
  const folder =
    envDir !== undefined && envDir !== ''
      ? envDir
      : join(homedir(), loadBalancerStatics.registry.homeRelativeDir);

  ensureDirSync(folder);

  const filePath = join(folder, loadBalancerStatics.registry.fileName);
  const database = openSqliteDatabase({
    filePath,
    busyTimeoutMs: loadBalancerStatics.registry.busyTimeoutMs,
  });

  database.exec(
    'CREATE TABLE IF NOT EXISTS durations (repo_root TEXT, package TEXT, check_type TEXT, duration_ms INTEGER, peak_rss_mb INTEGER NULL, shards INTEGER NULL, recorded_at_ms INTEGER);',
  );
  database.exec(
    'CREATE INDEX IF NOT EXISTS idx_durations_lookup ON durations (repo_root, package, check_type, recorded_at_ms);',
  );
  database.exec(
    'CREATE TABLE IF NOT EXISTS leases (lease_id TEXT PRIMARY KEY, tool TEXT, label TEXT, owner_pid INTEGER, state TEXT, expected_peak_mb INTEGER NULL, current_rss_mb INTEGER NULL, started_at_ms INTEGER, last_beat_ms INTEGER);',
  );
  database.exec('CREATE INDEX IF NOT EXISTS idx_leases_tool_state ON leases (tool, state);');
  database.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);');

  return database;
};
