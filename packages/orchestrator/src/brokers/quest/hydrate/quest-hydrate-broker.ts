/**
 * PURPOSE: Produces a persisted quest at a target status by creating it at `created`, walking modify-quest through each hydrator-strategy transition, and overwriting workItems at `in_progress` from the blueprint's steps
 *
 * USAGE:
 * const { questId } = await questHydrateBroker({ blueprint, guildId, questSource: 'smoketest-orchestration' });
 * // Returns: { questId }; quest.json is on disk under guild/quests/{questId}/quest.json at blueprint.targetStatus (default in_progress), tagged with the optional questSource
 *
 * WHEN-TO-USE: Smoketests and integration tests that need a quest in a specific status without running the real agent pipeline.
 * WHEN-NOT-TO-USE: Anywhere the quest should be produced by a real ChaosWhisperer or PathSeeker run.
 */

import {
  addQuestInputContract,
  fileContentsContract,
  folderTypeGroupsContract,
  questContract,
  questIdContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type {
  GuildId,
  QuestId,
  QuestSource,
  QuestStatus,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { QuestBlueprint } from '../../../contracts/quest-blueprint/quest-blueprint-contract';
import { questHydrateStrategyStatics } from '../../../statics/quest-hydrate-strategy/quest-hydrate-strategy-statics';
import { stepsToWorkItemsTransformer } from '../../../transformers/steps-to-work-items/steps-to-work-items-transformer';
import { workItemsSkipRolesTransformer } from '../../../transformers/work-items-skip-roles/work-items-skip-roles-transformer';
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

  // 3. If target is in_progress, overwrite workItems with the generated+filtered chain
  if (targetStatus === 'in_progress') {
    const quest = await questLoadBroker({ questFilePath });
    const now = isoTimestampContract.parse(new Date().toISOString());
    const pathseekerWorkItemId = questWorkItemIdContract.parse(crypto.randomUUID());

    const generatedWorkItems = stepsToWorkItemsTransformer({
      steps: blueprint.steps,
      flows: blueprint.flows,
      pathseekerWorkItemId,
      now,
      batchGroups: folderTypeGroupsContract.parse(undefined),
    });

    const filteredWorkItems = workItemsSkipRolesTransformer({
      workItems: generatedWorkItems,
      skipRoles: blueprint.skipRoles,
    });

    const stampedWorkItems = filteredWorkItems.map((wi) => {
      const override = blueprint.rolePromptOverrides[wi.role];
      return override === undefined ? wi : { ...wi, smoketestPromptOverride: override };
    });

    // Inject a pre-completed pathseeker work item so codeweavers (which depend on
    // pathseekerWorkItemId by construction of stepsToWorkItemsTransformer) have a
    // satisfied dependency at the top of the chain. Without this, the orchestration
    // loop sees pathseekerWorkItemId as an unknown id, codeweaver is never ready,
    // and the quest immediately reports blocked. Scenario-driver's sweep only stamps
    // pending+unstamped items, so this completed pathseeker is never re-dispatched
    // on the initial run — replans that insert new pending pathseekers are stamped
    // from the scenario's pathseeker script as usual.
    const pathseekerPlaceholder: WorkItem = workItemContract.parse({
      id: pathseekerWorkItemId,
      role: 'pathseeker',
      status: 'complete',
      spawnerType: 'agent',
      dependsOn: [],
      maxAttempts: 1,
      createdAt: now,
      completedAt: now,
    });

    const updatedQuest = questContract.parse({
      ...quest,
      workItems: [pathseekerPlaceholder, ...stampedWorkItems],
      updatedAt: now,
    });

    const finalJson = fileContentsContract.parse(
      JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
    );
    await questPersistBroker({ questFilePath, contents: finalJson, questId });
  }

  return { questId };
};
