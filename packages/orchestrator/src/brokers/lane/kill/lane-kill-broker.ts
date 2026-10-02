/**
 * PURPOSE: Kills the siegelense instance a `needsLane` work item recorded on
 * `payload.instance.instanceId`, once — the ROUTER closes the lane the router opened, never the
 * session (`packages/siegelense/CLAUDE.md`, `scrolls/orcha-changes/23-instances-and-capacity.md`).
 * Loaded from the QUEST's own checkout — `questCwdResolveBroker` names it, `moduleResolveBroker`
 * resolves `@dungeonmaster/siegelense/brokers` from its `node_modules`, and the same checkout rides
 * into `instanceKillBroker` as `repoRoot` — so a lane is stopped by the code that started it, never
 * by this process's own install. A quest whose recorded worktree is gone THROWS. The module is
 * reached through `dynamicImport` (`#gateway/node/module`) because the orchestrator cannot depend on
 * `@dungeonmaster/siegelense` (it is a cycle); `dynamicImport` hands back `unknown`, so the loaded
 * module is parsed through `siegelenseInstanceKillModuleContract` rather than cast.
 *
 * `instanceKillBroker` on siegelense's own side is idempotent by construction — it tolerates an
 * already-dead instance's id and reaps orphans either way (`instance-kill-broker.ts`'s own header)
 * — so a caller that redelivers an outcome record is safe to call this again for the SAME instance.
 * A re-mint never reaches that path, because a re-minted continuation is a FRESH work item with its
 * own `start` call and its own instance id.
 *
 * USAGE:
 * await laneKillBroker({ questId, instanceId });
 * // Resolves once siegelense has stopped that instance or reaped its orphaned processes
 */

import { moduleResolveBroker } from '@dungeonmaster/shared/brokers';
import type { Quest, SiegeInstance } from '@dungeonmaster/shared/contracts';
import { dynamicImport } from '#gateway/node/module';

import { laneKillResultContract } from '../../../contracts/lane-kill-result/lane-kill-result-contract';
import type { LaneKillResult } from '../../../contracts/lane-kill-result/lane-kill-result-contract';
import { siegelenseInstanceKillModuleContract } from '../../../contracts/siegelense-instance-kill-module/siegelense-instance-kill-module-contract';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';

const SIEGELENSE_BROKERS_MODULE_NAME = '@dungeonmaster/siegelense/brokers';

export const laneKillBroker = async ({
  questId,
  instanceId,
}: {
  questId: Quest['id'];
  instanceId: SiegeInstance['id'];
}): Promise<LaneKillResult> => {
  const resolution = await questCwdResolveBroker({ questId });
  if (resolution.kind === 'missing-worktree') {
    throw new Error(
      `Cannot kill a lane for quest ${questId}: worktree not found: ${resolution.worktreePath}`,
    );
  }
  const repoRoot = resolution.cwd;

  const { path: modulePath } = moduleResolveBroker({
    specifier: SIEGELENSE_BROKERS_MODULE_NAME,
    repoRoot,
  });

  const siegelenseBrokers = siegelenseInstanceKillModuleContract.parse(
    await dynamicImport({ path: modulePath }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load ${SIEGELENSE_BROKERS_MODULE_NAME}: ${message}`, {
        cause: error,
      });
    }),
  );

  const result = await siegelenseBrokers.instanceKillBroker({
    instanceId: String(instanceId),
    repoRoot,
  });

  return laneKillResultContract.parse(result);
};
