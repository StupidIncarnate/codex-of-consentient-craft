/**
 * PURPOSE: Acquires a machine coordination lease in the registry in the starting state.
 * Reach for this when spawning a long-running or resource-intensive child process (ward child or siegelense instance)
 * that needs its memory footprint tracked and coordinated against concurrency caps.
 *
 * USAGE:
 * const leaseId = await leaseTakeBroker({
 *   tool: 'ward',
 *   label: '@dungeonmaster/web',
 *   ownerPid: 12345,
 *   expectedPeakMB: 512,
 * });
 * // Returns a UUID string representing the acquired lease
 */

import { randomUUID } from '#gateway/node/crypto';
import { registryOpenBroker } from '../../registry/open/registry-open-broker';

export const leaseTakeBroker = async ({
  tool,
  label,
  ownerPid,
  expectedPeakMB,
  nowMs,
}: {
  tool: 'ward' | 'siegelense';
  label: string;
  ownerPid: number;
  expectedPeakMB?: number | null;
  nowMs?: number;
}): Promise<string> => {
  const database = registryOpenBroker();
  const leaseId = randomUUID();
  const currentTime = nowMs ?? Date.now();

  const statement = database.prepare(
    'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
  );
  statement.run(
    leaseId,
    tool,
    label,
    ownerPid,
    'starting',
    expectedPeakMB ?? null,
    null,
    currentTime,
    currentTime,
  );

  return Promise.resolve(leaseId);
};
