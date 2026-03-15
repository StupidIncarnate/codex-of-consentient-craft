/**
 * PURPOSE: Executes the pathseeker phase within the orchestration loop, including pathseekerRun tracking and verification
 *
 * USAGE:
 * await runPathseekerLayerBroker({questId, startPath});
 * // Spawns PathSeeker, verifies quest, writes pathseekerRun entry
 */

import type { FilePath, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { verifyQuestInputContract } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questVerifyBroker } from '../verify/quest-verify-broker';

const PATHSEEKER_TIMEOUT_MS = 600000;

export const runPathseekerLayerBroker = async ({
  questId,
  startPath,
  resumeSessionId,
  onAgentEntry,
}: {
  questId: QuestId;
  startPath: FilePath;
  resumeSessionId?: SessionId;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<{ verifySuccess: boolean }> => {
  const pathseekerRunEntry = {
    attempt: 0,
    startedAt: new Date().toISOString(),
    status: 'in_progress' as const,
  };

  const modifyRunInput = modifyQuestInputContract.parse({
    questId,
    pathseekerRuns: [pathseekerRunEntry],
  });
  await questModifyBroker({ input: modifyRunInput });

  const workUnit = workUnitContract.parse({
    role: 'pathseeker',
    questId,
  });

  const slotIndex = slotIndexContract.parse(0);
  const timeoutMs = timeoutMsContract.parse(PATHSEEKER_TIMEOUT_MS);

  const spawnResult = await agentSpawnByRoleBroker({
    workUnit,
    timeoutMs,
    startPath,
    ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
    ...(onAgentEntry === undefined
      ? {}
      : {
          onLine: ({ line }: { line: string }) => {
            onAgentEntry({ slotIndex, entry: { raw: line } });
          },
        }),
  });

  const sessionId = spawnResult.sessionId ?? undefined;

  const sessionRunInput = modifyQuestInputContract.parse({
    questId,
    pathseekerRuns: [
      {
        ...pathseekerRunEntry,
        sessionId,
      },
    ],
  });
  await questModifyBroker({ input: sessionRunInput });

  const verifyInput = verifyQuestInputContract.parse({ questId });
  const verifyResult = await questVerifyBroker({ input: verifyInput });

  const newStatus = verifyResult.success ? 'complete' : 'verification_failed';

  const updateRunInput = modifyQuestInputContract.parse({
    questId,
    pathseekerRuns: [
      {
        ...pathseekerRunEntry,
        sessionId,
        completedAt: new Date().toISOString(),
        status: newStatus,
      },
    ],
  });
  await questModifyBroker({ input: updateRunInput });

  return { verifySuccess: verifyResult.success };
};
