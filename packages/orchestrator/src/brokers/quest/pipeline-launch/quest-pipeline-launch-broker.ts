/**
 * PURPOSE: Resolves quest file path and guild start path, then launches the quest pipeline
 *
 * USAGE:
 * await questPipelineLaunchBroker({ processId, questId, onPhaseChange, onAgentLine });
 * // Finds quest path, gets guild, launches pipeline with resolved paths
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questPipelineBroker } from '../pipeline/quest-pipeline-broker';

const QUEST_FILE_NAME = 'quest.json';

export const questPipelineLaunchBroker = async ({
  processId,
  questId,
  onPhaseChange,
  onAgentLine,
}: {
  processId: ProcessId;
  questId: QuestId;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  onAgentLine?: (params: { slotIndex: SlotIndex; line: string }) => void;
}): Promise<void> => {
  const { questPath, guildId } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
  );
  const guild = await guildGetBroker({ guildId });
  const startPath = filePathContract.parse(guild.path);

  await questPipelineBroker({
    processId,
    questId,
    questFilePath,
    startPath,
    onPhaseChange,
    ...(onAgentLine === undefined ? {} : { onAgentLine }),
  });
};
