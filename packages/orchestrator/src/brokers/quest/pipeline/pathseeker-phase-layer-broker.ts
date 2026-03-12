/**
 * PURPOSE: Runs the pathseeker phase — spawns PathSeeker agent via unified broker and waits for completion
 *
 * USAGE:
 * await pathseekerPhaseLayerBroker({processId, questId, startPath, onPhaseChange});
 * // Spawns PathSeeker agent to create step plan, streams output, waits for process exit
 */

import type { FilePath, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';

const PATHSEEKER_TIMEOUT_MS = 600000;

export const pathseekerPhaseLayerBroker = async ({
  processId: _processId,
  questId,
  startPath,
  onPhaseChange,
  onAgentEntry,
}: {
  processId: ProcessId;
  questId: QuestId;
  startPath: FilePath;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<void> => {
  onPhaseChange({ phase: 'pathseeker' });

  const workUnit = workUnitContract.parse({
    role: 'pathseeker',
    questId,
  });

  const slotIndex = slotIndexContract.parse(0);
  const timeoutMs = timeoutMsContract.parse(PATHSEEKER_TIMEOUT_MS);

  await agentSpawnByRoleBroker({
    workUnit,
    timeoutMs,
    startPath,
    ...(onAgentEntry === undefined
      ? {}
      : {
          onLine: ({ line }: { line: string }) => {
            onAgentEntry({ slotIndex, entry: { raw: line } });
          },
        }),
  });
};
