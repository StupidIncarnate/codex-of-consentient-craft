/**
 * PURPOSE: Persists a new quest.json on disk at status 'created' with empty-array defaults (or caller-provided initial workItems). Single source of truth for the initial quest file shape.
 *
 * USAGE:
 * const { questFilePath, questFolderPath } = await questCreateBroker({ questId, guildId, input });
 * // Returns: { questFilePath, questFolderPath }; quest.json is on disk under guild/quests/{questId}/quest.json at status 'created'.
 *
 * Optionally seed work items in the same persist so callers (like questUserAddBroker)
 * don't need a second persist+outbox event for the initial chaoswhisperer item:
 *   await questCreateBroker({ questId, guildId, input, initialWorkItems: [chaosItem] });
 *
 * PLAN OPERATION ITEM: for quest types with an intake agent (feature's chaoswhisperer), the
 * create seeds ONE plan operation item ({ role, text: 'Author spec + implementation plan',
 * status: in_progress, locked }) and stitches its operations/<id> ref into the caller-supplied
 * intake work item — so EVERY work item, from the first, carries exactly one operations link.
 *
 * WHEN-TO-USE: Anywhere a quest file needs to be produced at status 'created' (user-initiated add, hydrator walk starting point).
 * WHEN-NOT-TO-USE: To modify an existing quest — use questModifyBroker.
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  operationItemContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type {
  AddQuestInput,
  FilePath,
  GuildId,
  OperationItem,
  QuestId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics, questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { questResolveQuestsPathBroker } from '../resolve-quests-path/quest-resolve-quests-path-broker';
const JSON_INDENT_SPACES = 2;

export const questCreateBroker = async ({
  questId,
  guildId,
  input,
  initialWorkItems,
}: {
  questId: QuestId;
  guildId: GuildId;
  input: AddQuestInput;
  initialWorkItems?: WorkItem[];
}): Promise<{ questFilePath: FilePath; questFolderPath: FilePath }> => {
  const { questsPath } = questResolveQuestsPathBroker({ guildId });
  const questsBasePath = filePathContract.parse(questsPath);
  await fsMkdirAdapter({ filepath: questsBasePath });

  const questFolderPath = filePathContract.parse(
    pathJoinAdapter({ paths: [questsBasePath, questId] }),
  );
  await fsMkdirAdapter({ filepath: questFolderPath });

  const { initialWorkItemRole } = questTypeRegistryStatics[input.questType ?? 'feature'];

  const planOperationItem: OperationItem | null =
    initialWorkItemRole === null
      ? null
      : operationItemContract.parse({
          id: crypto.randomUUID(),
          role: initialWorkItemRole,
          text: 'Author spec + implementation plan',
          status: 'in_progress',
          locked: true,
        });

  // Stitch the plan item's ref into the intake work item so the strict 1:1 link invariant holds
  // from the very first work item.
  const linkedWorkItems = (initialWorkItems ?? []).map((workItem) =>
    planOperationItem !== null && workItem.role === initialWorkItemRole
      ? {
          ...workItem,
          relatedDataItems: [
            ...workItem.relatedDataItems,
            `operations/${String(planOperationItem.id)}`,
          ],
        }
      : workItem,
  );

  const initialQuest = questContract.parse({
    id: questId,
    folder: questId,
    title: input.title,
    status: 'created',
    createdAt: new Date().toISOString(),
    designDecisions: [],
    operations: planOperationItem === null ? [] : [planOperationItem],
    toolingRequirements: [],
    contracts: [],
    flows: [],
    needsDesign: false,
    userRequest: input.userRequest,
    workItems: linkedWorkItems,
    wardResults: [],
    planningNotes: { blightReports: [] },
    ...(input.questSource === undefined ? {} : { questSource: input.questSource }),
    ...(input.questType === undefined ? {} : { questType: input.questType }),
  });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questFolderPath, locationsStatics.quest.questFile] }),
  );
  const contents = fileContentsContract.parse(
    JSON.stringify(initialQuest, null, JSON_INDENT_SPACES),
  );
  await questPersistBroker({ questFilePath, contents, questId });

  return { questFilePath, questFolderPath };
};
