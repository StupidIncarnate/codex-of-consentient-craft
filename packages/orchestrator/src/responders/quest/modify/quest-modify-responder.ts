/**
 * PURPOSE: Modifies a quest via questModifyBroker and emits a quest-modified event on success
 *
 * USAGE:
 * const result = await QuestModifyResponder({ questId: 'add-auth', input: {...} });
 * // Returns ModifyQuestResult with success status
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import { filePathContract, processIdContract } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestResult } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';

const QUEST_FILE_NAME = 'quest.json';

export const QuestModifyResponder = async ({
  questId,
  input,
}: {
  questId: string;
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  const result = await questModifyBroker({ input: { ...input, questId } as ModifyQuestInput });

  if (result.success) {
    const { guildId, questPath } = await questFindQuestPathBroker({
      questId: questId as QuestId,
    });

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );
    const quest = await questLoadBroker({ questFilePath });

    orchestrationEventsState.emit({
      type: 'quest-modified',
      processId: processIdContract.parse(crypto.randomUUID()),
      payload: { questId, guildId, quest },
    });
  }

  return result;
};
