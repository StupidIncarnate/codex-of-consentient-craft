/**
 * PURPOSE: Layer helper for SmoketestRunResponder — overwrites quest.workItems under the per-questId lock for MCP/Signals bundled suites (workItems is not a modify-quest allowed field at in_progress)
 *
 * USAGE:
 * await OverwriteWorkItemsLayerResponder({ questId, workItems });
 * // Replaces quest.workItems wholesale with the suite's seeded chain.
 *
 * WHEN-TO-USE: MCP/Signals suites only; orchestration scenarios do not call this path.
 */

import {
  fileContentsContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type { WorkItem, Quest } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { join } from '#gateway/node/path';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';
import { questPersistBroker } from '../../../brokers/quest/persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../../../brokers/quest/with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;

export const OverwriteWorkItemsLayerResponder = async ({
  questId,
  workItems,
}: {
  questId: Quest['id'];
  workItems: readonly WorkItem[];
}): Promise<void> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<void> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        join(questPath, locationsStatics.quest.questFile),
      );
      const loaded = await questLoadBroker({ questFilePath });
      const updatedQuest = questContract.parse({
        ...loaded,
        workItems: [...workItems],
        updatedAt: new Date().toISOString(),
      });
      const json = fileContentsContract.parse(
        JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
      );
      await questPersistBroker({ questFilePath, contents: json, questId });
    },
  });
