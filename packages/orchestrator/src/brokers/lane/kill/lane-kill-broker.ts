/**
 * PURPOSE: Kills the siegelense instance a `needsLane` work item recorded on
 * `payload.instance.instanceId`, once — the ROUTER closes the lane the router opened, never the
 * session (`packages/siegelense/CLAUDE.md`, `scrolls/orcha-changes/23-instances-and-capacity.md`).
 * Reached through `require.resolve` + `runtimeDynamicImportAdapter`, the same route every other
 * lane broker takes, because the orchestrator cannot depend on `@dungeonmaster/siegelense` (it is
 * a cycle).
 *
 * `instanceKillBroker` on siegelense's own side is idempotent by construction — it tolerates an
 * already-dead instance's id and reaps orphans either way (`instance-kill-broker.ts`'s own header)
 * — so a caller that redelivers an outcome record is safe to call this again for the SAME instance.
 * A re-mint never reaches that path, because a re-minted continuation is a FRESH work item with its
 * own `start` call and its own instance id.
 *
 * USAGE:
 * await laneKillBroker({ instanceId });
 * // Resolves once siegelense has stopped that instance or reaped its orphaned processes
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { SiegeInstanceId } from '@dungeonmaster/shared/contracts';
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';

import { laneKillResultContract } from '../../../contracts/lane-kill-result/lane-kill-result-contract';
import type { LaneKillResult } from '../../../contracts/lane-kill-result/lane-kill-result-contract';

const SIEGELENSE_BROKERS_MODULE_NAME = '@dungeonmaster/siegelense/brokers';

export const laneKillBroker = async ({
  instanceId,
}: {
  instanceId: SiegeInstanceId;
}): Promise<LaneKillResult> => {
  const modulePath = filePathContract.parse(require.resolve(SIEGELENSE_BROKERS_MODULE_NAME));

  const siegelenseBrokers = await runtimeDynamicImportAdapter<{
    instanceKillBroker: (params: { instanceId: string }) => Promise<unknown>;
  }>({ path: modulePath }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load ${SIEGELENSE_BROKERS_MODULE_NAME}: ${message}`, {
      cause: error,
    });
  });

  const result = await siegelenseBrokers.instanceKillBroker({ instanceId: String(instanceId) });

  return laneKillResultContract.parse(result);
};
