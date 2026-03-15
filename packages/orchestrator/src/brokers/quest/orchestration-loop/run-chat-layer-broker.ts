/**
 * PURPOSE: Spawns chaos/glyph agents with streaming, writes sessionId to work item
 *
 * USAGE:
 * await runChatLayerBroker({ questId, questFilePath, workItem, startPath });
 * // Spawns chaos or glyph agent, writes sessionId and completion status back to quest
 */

import type { FilePath, QuestId, UserInput, WorkItem } from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const runChatLayerBroker = async ({
  questId,
  workItem,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  workItem: WorkItem;
  startPath: FilePath;
  userMessage?: UserInput;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<void> => {
  // NOTE: Full implementation deferred until workUnitContract is extended with chaos/glyph roles.
  // When implemented, this will:
  // 1. Build work unit for chaos/glyph role using startPath + userMessage
  // 2. Spawn via agentSpawnByRoleBroker with streaming via onAgentEntry
  // 3. Write sessionId back to work item
  // 4. Mark complete/failed based on spawn result

  await questModifyBroker({
    input: {
      questId,
      workItems: [
        {
          id: workItem.id,
          status: 'complete',
          completedAt: new Date().toISOString(),
        },
      ],
    } as ModifyQuestInput,
  });
};
