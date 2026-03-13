/**
 * PURPOSE: Writes an execution log entry to a quest via questModifyBroker
 *
 * USAGE:
 * await writeExecutionLogLayerBroker({questId, agentType: 'ward', status: 'pass', report: 'ward-phase'});
 * // Appends an ExecutionLogEntry to the quest's executionLog array
 */

import {
  executionLogEntryContract,
  type AgentType,
  type QuestId,
} from '@dungeonmaster/shared/contracts';
import type { ExecutionLogEntry } from '@dungeonmaster/shared/contracts';

import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const writeExecutionLogLayerBroker = async ({
  questId,
  agentType,
  status,
  report,
}: {
  questId: QuestId;
  agentType: AgentType;
  status: NonNullable<ExecutionLogEntry['status']>;
  report: ExecutionLogEntry['report'];
}): Promise<void> => {
  const entry = executionLogEntryContract.parse({
    agentType,
    status,
    report,
    timestamp: new Date().toISOString(),
  });

  const modifyInput = modifyQuestInputContract.parse({
    questId,
    executionLog: [entry],
  });
  await questModifyBroker({ input: modifyInput });
};
