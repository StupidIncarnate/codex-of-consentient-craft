/**
 * PURPOSE: Updates the heartbeat timestamp, process state, and resident memory of an active lease.
 * Reach for this periodically (every heartbeatIntervalMs) during command execution or background tasks
 * to prevent leases from going stale and being reaped by leaseListLiveBroker.
 *
 * USAGE:
 * await leaseBeatBroker({
 *   leaseId: 'lease-123',
 *   currentRssMB: 256,
 *   state: 'running',
 * });
 * // Updates last_beat_ms, current_rss_mb, and state in the leases table
 */

import { registryOpenBroker } from '../../registry/open/registry-open-broker';

export const leaseBeatBroker = async ({
  leaseId,
  currentRssMB,
  state,
  nowMs,
}: {
  leaseId: string;
  currentRssMB?: number | null;
  state?: 'starting' | 'running';
  nowMs?: number;
}): Promise<void> => {
  const database = registryOpenBroker();
  const currentTime = nowMs ?? Date.now();
  const newState = state ?? 'running';

  if (currentRssMB === undefined) {
    const statement = database.prepare(
      'UPDATE leases SET last_beat_ms = ?, state = ? WHERE lease_id = ?;',
    );
    statement.run(currentTime, newState, leaseId);
  } else {
    const statement = database.prepare(
      'UPDATE leases SET last_beat_ms = ?, current_rss_mb = ?, state = ? WHERE lease_id = ?;',
    );
    statement.run(currentTime, currentRssMB, newState, leaseId);
  }

  return Promise.resolve();
};
