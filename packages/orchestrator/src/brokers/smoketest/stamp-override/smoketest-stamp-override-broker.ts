/**
 * PURPOSE: Atomically stamps a smoketestPromptOverride onto a single work item under the quest-modify lock
 *
 * USAGE:
 * await smoketestStampOverrideBroker({ questId, workItemId, override: PromptTextStub() });
 * // Reads the quest under the lock, mutates one work item, persists atomically. No-op if already stamped.
 *
 * WHEN-TO-USE: The smoketest scenario driver stamps canned overrides on dynamically-inserted work items
 * (retries, replans) that the hydrator could not pre-stamp. Bypasses questModifyBroker because `workItems`
 * is not in any status's allowedFields; uses the public `questWithModifyLockBroker` so the read-modify-write
 * is serialized against concurrent modify-quest callers on the same questId.
 * WHEN-NOT-TO-USE: Anywhere outside the smoketest flow — production code should never mutate
 * `smoketestPromptOverride`.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';
import { questPersistBroker } from '../../quest/persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../../quest/with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;

export const smoketestStampOverrideBroker = async ({
  questId,
  workItemId,
  override,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  override: PromptText;
}): Promise<{ success: true }> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<{ success: true }> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );

      const loadedQuest = await questLoadBroker({ questFilePath });

      const target = loadedQuest.workItems.find((wi) => wi.id === workItemId);
      if (target === undefined) {
        throw new Error(
          `smoketestStampOverrideBroker: work item "${workItemId}" not found on quest "${questId}"`,
        );
      }

      if (target.smoketestPromptOverride !== undefined) {
        // Idempotent — already stamped, no-op
        return { success: true as const };
      }

      const updatedWorkItems = loadedQuest.workItems.map((wi) =>
        wi.id === workItemId ? { ...wi, smoketestPromptOverride: override } : wi,
      );

      const updatedQuest = questContract.parse({
        ...loadedQuest,
        workItems: updatedWorkItems,
        updatedAt: new Date().toISOString(),
      });

      const questJson = fileContentsContract.parse(
        JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
      );

      await questPersistBroker({ questFilePath, contents: questJson, questId });

      return { success: true as const };
    },
  });
