/**
 * PURPOSE: Layer helper for SmoketestRunResponder — overwrites quest.workItems under the per-questId lock for MCP/Signals bundled suites (workItems is not a modify-quest allowed field at in_progress)
 *
 * USAGE:
 * await OverwriteWorkItemsLayerResponder({ questId, workItems });
 * // Preserves the hydrator's pre-completed pathseeker placeholder, then prepends the transformer-produced codeweaver chain.
 *
 * WHEN-TO-USE: MCP/Signals suites only; orchestration scenarios do not call this path.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  fileContentsContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestId, WorkItem } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';
import { questPersistBroker } from '../../../brokers/quest/persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../../../brokers/quest/with-modify-lock/quest-with-modify-lock-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const OverwriteWorkItemsLayerResponder = async ({
  questId,
  workItems,
}: {
  questId: QuestId;
  workItems: readonly WorkItem[];
}): Promise<AdapterResult> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<AdapterResult> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
      );
      const loaded = await questLoadBroker({ questFilePath });
      const hydratorPathseeker = loaded.workItems.find((wi) => wi.role === 'pathseeker');
      const finalWorkItems =
        hydratorPathseeker === undefined ? [...workItems] : [hydratorPathseeker, ...workItems];
      const updatedQuest = questContract.parse({
        ...loaded,
        workItems: finalWorkItems,
        updatedAt: new Date().toISOString(),
      });
      const json = fileContentsContract.parse(
        JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
      );
      await questPersistBroker({ questFilePath, contents: json, questId });
      return adapterResultContract.parse({ success: true });
    },
  });
