/**
 * PURPOSE: Resolves the quest ID for a chat spawn, creating a new quest for ChaosWhisperer or validating an existing quest for Glyphsmith
 *
 * USAGE:
 * const questId = await resolveQuestLayerBroker({ role: 'chaoswhisperer', message: 'Build auth', guildId, chatProcessId });
 * // Returns QuestId for the resolved quest, or null for resume sessions
 */

import type { GuildId, ProcessId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import { addQuestInputContract } from '../../../contracts/add-quest-input/add-quest-input-contract';
import type { ChatRole } from '../../../contracts/chat-role/chat-role-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { questStatics } from '../../../statics/quest/quest-statics';
import { questAddBroker } from '../../quest/add/quest-add-broker';
import { questGetBroker } from '../../quest/get/quest-get-broker';

export const resolveQuestLayerBroker = async ({
  role,
  questId,
  sessionId,
  message,
  guildId,
  chatProcessId,
  onQuestCreated,
}: {
  role: ChatRole;
  questId?: QuestId;
  sessionId?: SessionId;
  message: string;
  guildId: GuildId;
  chatProcessId: ProcessId;
  onQuestCreated?: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
}): Promise<QuestId | null> => {
  if (role === 'glyphsmith') {
    if (!questId) {
      throw new Error('questId is required for glyphsmith role');
    }

    const input = getQuestInputContract.parse({ questId });
    const result = await questGetBroker({ input });

    if (!result.success || !result.quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const questStatus = result.quest.status;
    const allowedStatuses = questStatics.designStatuses.allowed;
    const isValidStatus = allowedStatuses.some((status) => status === questStatus);

    if (!isValidStatus) {
      throw new Error(
        `Quest must be in a design status (${allowedStatuses.join(', ')}) to start design chat. Current status: ${questStatus}`,
      );
    }

    return questId;
  }

  if (sessionId) {
    return questId ?? null;
  }

  const addInput = addQuestInputContract.parse({ title: 'New Quest', userRequest: message });
  const questResult = await questAddBroker({ input: addInput, guildId });

  if (!questResult.success || !questResult.questId) {
    throw new Error(`Failed to create quest: ${questResult.error ?? 'unknown'}`);
  }

  onQuestCreated?.({ questId: questResult.questId, chatProcessId });

  return questResult.questId;
};
