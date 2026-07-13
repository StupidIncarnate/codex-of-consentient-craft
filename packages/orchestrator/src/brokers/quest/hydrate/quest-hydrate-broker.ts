/**
 * PURPOSE: Produces a persisted quest at a target status by creating it at `created`, walking modify-quest through each hydrator-strategy transition, and seeding the operations relay (verify tail + first work item) at `in_progress`
 *
 * USAGE:
 * const { questId } = await questHydrateBroker({ blueprint, guildId, questSource: 'smoketest-orchestration' });
 * // Returns: { questId }; quest.json is on disk under guild/quests/{questId}/quest.json at blueprint.targetStatus (default in_progress), tagged with the optional questSource
 *
 * WHEN-TO-USE: Smoketests and integration tests that need a quest in a specific status without running the real agent pipeline.
 * WHEN-NOT-TO-USE: Anywhere the quest should be produced by a real ChaosWhisperer run.
 */

import {
  addQuestInputContract,
  fileContentsContract,
  operationItemContract,
  questContract,
  questIdContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestId, QuestSource, QuestStatus } from '@dungeonmaster/shared/contracts';

import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { QuestBlueprint } from '../../../contracts/quest-blueprint/quest-blueprint-contract';
import { questHydrateStrategyStatics } from '../../../statics/quest-hydrate-strategy/quest-hydrate-strategy-statics';
import { questBuildRelayGraphBroker } from '../build-relay-graph/quest-build-relay-graph-broker';
import { questCreateBroker } from '../create/quest-create-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questPersistBroker } from '../persist/quest-persist-broker';
import { buildHydrateInputLayerBroker } from './build-hydrate-input-layer-broker';

const JSON_INDENT_SPACES = 2;

export const questHydrateBroker = async ({
  blueprint,
  guildId,
  questSource,
}: {
  blueprint: QuestBlueprint;
  guildId: GuildId;
  questSource?: QuestSource;
}): Promise<{ questId: QuestId }> => {
  const questId = blueprint.fixedQuestId ?? questIdContract.parse(crypto.randomUUID());
  const targetStatus: QuestStatus = blueprint.targetStatus ?? 'in_progress';

  // 1. Create the quest folder + initial quest.json at status 'created'
  const input = addQuestInputContract.parse({
    title: blueprint.title,
    userRequest: blueprint.userRequest,
    ...(questSource === undefined ? {} : { questSource }),
  });
  const { questFilePath } = await questCreateBroker({ questId, guildId, input });

  // 2. Walk modify-quest through each transition up to targetStatus
  await questHydrateStrategyStatics.walkPath.reduce<Promise<boolean>>(
    async (prevReachedTarget, toStatus) => {
      const reached = await prevReachedTarget;
      if (reached) {
        return true;
      }
      const modifyInput = buildHydrateInputLayerBroker({ blueprint, toStatus, questId });
      const result = await questModifyBroker({ input: modifyInput });
      if (!result.success) {
        throw new Error(
          `quest-hydrate: modify-quest to ${toStatus} failed: ${result.error ?? 'unknown'}`,
        );
      }
      return toStatus === targetStatus;
    },
    Promise.resolve(false),
  );

  // 3. If target is in_progress, seed the operations relay the same way Start Quest does:
  //    append the verify tail, apply skipRoles (smoketests drop roles their scenario doesn't
  //    script), and create ONE work item for the first actionable operation item.
  if (targetStatus === 'in_progress') {
    const quest = await questLoadBroker({ questFilePath });
    const now = isoTimestampContract.parse(new Date().toISOString());

    const relay = questBuildRelayGraphBroker({ quest, priorWorkItemIds: [], now });
    const skipRoles = new Set(blueprint.skipRoles);

    // Re-derive the first actionable item AFTER filtering — the builder may have marked a
    // now-skipped role's item in_progress.
    const operations = relay.operations
      .filter((operation) => !skipRoles.has(operation.role))
      .map((operation) =>
        operation.status === 'in_progress' && operation.role !== 'chaoswhisperer'
          ? operationItemContract.parse({ ...operation, status: 'pending' })
          : operation,
      );
    const firstActionable = operations.find((operation) => operation.status === 'pending');

    const firstWorkItem =
      firstActionable === undefined
        ? undefined
        : workItemContract.parse({
            id: questWorkItemIdContract.parse(crypto.randomUUID()),
            role: firstActionable.role,
            status: 'pending',
            spawnerType: firstActionable.role === 'ward' ? 'command' : 'agent',
            relatedDataItems: [`operations/${String(firstActionable.id)}`],
            dependsOn: [],
            maxAttempts: 1,
            createdAt: now,
            ...(firstActionable.wardMode === undefined
              ? {}
              : { wardMode: firstActionable.wardMode }),
            ...(blueprint.rolePromptOverrides[firstActionable.role] === undefined
              ? {}
              : { smoketestPromptOverride: blueprint.rolePromptOverrides[firstActionable.role] }),
          });

    const seededOperations =
      firstActionable === undefined
        ? operations
        : operations.map((operation) =>
            operation.id === firstActionable.id
              ? operationItemContract.parse({ ...operation, status: 'in_progress' })
              : operation,
          );

    const updatedQuest = questContract.parse({
      ...quest,
      operations: seededOperations,
      workItems:
        firstWorkItem === undefined ? quest.workItems : [...quest.workItems, firstWorkItem],
      updatedAt: now,
    });

    const finalJson = fileContentsContract.parse(
      JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
    );
    await questPersistBroker({ questFilePath, contents: finalJson, questId });
  }

  return { questId };
};
