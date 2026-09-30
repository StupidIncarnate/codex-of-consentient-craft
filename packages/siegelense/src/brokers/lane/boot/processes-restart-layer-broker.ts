/**
 * PURPOSE: The respawn half of a `reset level: 'instance'` restart — spawns every launch again
 * through `processesSpawnLayerBroker`, rewrites `livePgids` (the session's own `pgids` array) in
 * place with the new groups, re-stamps the registry row with them, and only THEN throws
 * `LaneRestartFailedError` if any launch never answered its ready path. The pgids are recorded
 * before the verdict because a respawned group that never became ready is still a running process
 * `kill` and teardown have to find and reap. Reach for `processesSpawnLayerBroker` directly for a
 * first boot, which records nothing and cleans up on its own terms.
 *
 * USAGE:
 * await processesRestartLayerBroker({ launches, cwd, bootTimeoutMs, instanceId, specName, livePgids });
 * // Resolves the Registry the new groups were stamped into, with livePgids holding them; throws LaneRestartFailedError
 * // naming each process that did not come back and its log path
 */

import type { Registry } from '../../../contracts/registry/registry-contract';
import type { LaneLaunch } from '../../../contracts/lane-launch/lane-launch-contract';
import { LaneRestartFailedError } from '../../../errors/lane-restart-failed/lane-restart-failed-error';
import { pgidsStampLayerBroker } from './pgids-stamp-layer-broker';
import { processesSpawnLayerBroker } from './processes-spawn-layer-broker';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

export const processesRestartLayerBroker = async ({
  launches,
  cwd,
  bootTimeoutMs,
  instanceId,
  specName,
  livePgids,
}: {
  launches: readonly LaneLaunch[];
  cwd: string;
  bootTimeoutMs: number;
  instanceId: SiegeInstance['id'];
  specName: string;
  livePgids: number[];
}): Promise<Registry> => {
  const restarted = await processesSpawnLayerBroker({ launches, cwd, bootTimeoutMs });

  livePgids.splice(0, livePgids.length, ...restarted.pgids);
  const stamped = await pgidsStampLayerBroker({ instanceId, pgids: restarted.pgids });

  if (restarted.unready.length > 0) {
    throw new LaneRestartFailedError({
      specName,
      instanceId,
      unready: restarted.unready.map((launch) => launch.name),
      logPaths: restarted.unready.map((launch) => launch.logPath),
    });
  }

  return stamped;
};
