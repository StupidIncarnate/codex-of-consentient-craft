/**
 * PURPOSE: The router's whole lane lifecycle for ONE dispatch round — given the NextStep
 * `computeNextStepFromQuestLayerBroker` already decided, bounds a `spawn-agents` batch of
 * `needsLane` work items by `siegelense capacity`'s `suggested` reading, starts a lane for each
 * surviving item that has none recorded yet, and returns the (possibly trimmed) NextStep. A step
 * that is NOT `spawn-agents`, or whose batch does not `needsLane`, passes straight through
 * unchanged — capacity is spent only where it was measured for.
 *
 * `capacityReadBroker` AND `instanceStartBroker` are pulled off ONE `require.resolve` +
 * `runtimeDynamicImportAdapter` call, never two — the orchestrator cannot depend on
 * `@dungeonmaster/siegelense` (it is a cycle), so this is the same route `cli-siegelense-responder.ts`
 * takes, and BOTH functions resolve the IDENTICAL `@dungeonmaster/siegelense/brokers` path. Two
 * independent resolutions (this broker calling out to a separate capacity-only broker and a
 * separate start-only broker, each doing its own import) would give this file's own proxy nothing
 * to key the two calls apart by — mocking that path is addressed purely by the path argument, so
 * two separate stagings for it COLLIDE, the later one silently winning and leaving the earlier
 * caller's function missing off the resolved module. ONE resolution, ONE staged module, is what
 * keeps both callable in the same test.
 *
 * A BATCH IS ONE STEP OF ONE FAMILY BY CONSTRUCTION (`selectBatchLayerBroker`'s own invariant), so
 * `needsLane` is either true for every item in `step.agents` or true for none of them — checking the
 * FIRST agent's work item answers for the whole batch.
 *
 * `bounded.length === 0` returns `null` — the honest "come back": every lane slot is already spent,
 * and a LATER scan tries again once an earlier lane's work item records and kills its instance. A
 * lane that fails to `start` THROWS rather than being caught here: "a lane that will not start is a
 * defect the round surfaces, never a wall" (this story's own operating rule) — the caller's own
 * error handling is what a defect like that belongs to, not a `wall` mark on a work item that never
 * dispatched.
 *
 * USAGE:
 * await laneProvisionBatchBroker({ quest, step });
 * // Returns the NextStep unchanged for a non-lane batch, or trimmed + lane-started for a lane one
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';

import { laneCapacityContract } from '../../../contracts/lane-capacity/lane-capacity-contract';
import { laneManifestReadingContract } from '../../../contracts/lane-manifest-reading/lane-manifest-reading-contract';
import { nextStepContract } from '../../../contracts/next-step/next-step-contract';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { laneStatics } from '../../../statics/lane/lane-statics';
import { laneManifestToWorkItemInstanceTransformer } from '../../../transformers/lane-manifest-to-work-item-instance/lane-manifest-to-work-item-instance-transformer';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { laneRecordInstanceBroker } from '../record-instance/lane-record-instance-broker';

const SIEGELENSE_BROKERS_MODULE_NAME = '@dungeonmaster/siegelense/brokers';

export const laneProvisionBatchBroker = async ({
  quest,
  step,
}: {
  quest: Quest;
  step: NextStep | null;
}): Promise<NextStep | null> => {
  if (step === null || step.type !== 'spawn-agents' || step.agents.length === 0) {
    return step;
  }

  const [firstAgent] = step.agents;
  const firstWorkItem = quest.workItems.find((item) => item.id === firstAgent?.workItemId);

  if (firstWorkItem?.needsLane !== true) {
    return step;
  }

  const modulePath = filePathContract.parse(require.resolve(SIEGELENSE_BROKERS_MODULE_NAME));

  const siegelenseBrokers = await runtimeDynamicImportAdapter<{
    capacityReadBroker: (params: { specName: string; poolSize: number | null }) => Promise<unknown>;
    instanceStartBroker: (params: {
      specName: string;
      questId: string | null;
      guildId: string | null;
      seed: string | null;
    }) => Promise<unknown>;
  }>({ path: modulePath }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load ${SIEGELENSE_BROKERS_MODULE_NAME}: ${message}`, {
      cause: error,
    });
  });

  const capacity = laneCapacityContract.parse(
    await siegelenseBrokers.capacityReadBroker({
      specName: laneStatics.defaults.specName,
      poolSize: null,
    }),
  );
  const bounded = step.agents.slice(0, capacity.suggested);

  if (bounded.length === 0) {
    return null;
  }

  // Resolved ONCE for the whole batch, never re-resolved inside laneRecordInstanceBroker: every
  // lane in this batch belongs to the SAME quest, so the same questPath and guildId answer for
  // all of them, and a second resolution per lane would cost a real fs walk per lane for an
  // answer already in hand.
  const { questPath, guildId } = await questFindQuestPathBroker({ questId: quest.id });

  await Promise.all(
    bounded.map(async (agent) => {
      const workItem = quest.workItems.find((item) => item.id === agent.workItemId);

      if (workItem === undefined || workItem.payload?.instance !== undefined) {
        return;
      }

      const rawManifest = await siegelenseBrokers.instanceStartBroker({
        specName: laneStatics.defaults.specName,
        questId: String(quest.id),
        // questFindQuestPathBroker always resolves a guildId for an existing quest — every guild
        // owns its quests, so there is no quest this router dispatches for that has none.
        guildId: String(guildId),
        seed: null,
      });
      const manifest = laneManifestReadingContract.parse(rawManifest);
      const instance = laneManifestToWorkItemInstanceTransformer({ manifest });

      await laneRecordInstanceBroker({
        questId: quest.id,
        questPath,
        workItemId: agent.workItemId,
        instance,
      });
    }),
  );

  return nextStepContract.parse({ type: 'spawn-agents', agents: bounded });
};
