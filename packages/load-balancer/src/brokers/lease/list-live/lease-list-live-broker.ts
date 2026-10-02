/**
 * PURPOSE: Lists all live coordination leases, purging dead processes and stale heartbeats from the registry.
 * Reach for this when evaluating machine capacity before launching new jobs or inspecting running workloads.
 *
 * USAGE:
 * const leases = await leaseListLiveBroker();
 * // Returns readonly Lease[] of all verified live leases
 */

import { kill } from '#gateway/node/process';
import { leaseContract, type Lease } from '../../../contracts/lease/lease-contract';
import { loadBalancerStatics } from '../../../statics/load-balancer/load-balancer-statics';
import { registryOpenBroker } from '../../registry/open/registry-open-broker';

export const leaseListLiveBroker = async ({
  nowMs,
}: {
  nowMs?: number;
} = {}): Promise<readonly Lease[]> => {
  const database = registryOpenBroker();
  const currentTime = nowMs ?? Date.now();

  const selectStatement = database.prepare(
    'SELECT lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms FROM leases;',
  );
  const deleteStatement = database.prepare('DELETE FROM leases WHERE lease_id = ?;');

  const rawRows = selectStatement.all();
  const liveLeases: Lease[] = [];

  for (const row of rawRows) {
    let isAlive = true;
    try {
      kill(Number(row.owner_pid), 0);
    } catch (error: unknown) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ESRCH'
      ) {
        isAlive = false;
      } else if (
        error === null ||
        typeof error !== 'object' ||
        !('code' in error) ||
        error.code !== 'EPERM'
      ) {
        throw error;
      }
    }

    const isStale = currentTime - Number(row.last_beat_ms) > loadBalancerStatics.lease.staleAfterMs;

    if (!isAlive || isStale) {
      deleteStatement.run(String(row.lease_id));
    } else {
      const lease = leaseContract.parse({
        leaseId: row.lease_id,
        tool: row.tool,
        label: row.label,
        ownerPid: row.owner_pid,
        state: row.state,
        expectedPeakMB: row.expected_peak_mb,
        currentRssMB: row.current_rss_mb,
        startedAtMs: row.started_at_ms,
        lastBeatMs: row.last_beat_ms,
      });
      liveLeases.push(lease);
    }
  }

  return Promise.resolve(liveLeases);
};
